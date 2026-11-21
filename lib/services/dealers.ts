import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Dealer,
  DealerAnalytics,
  DealerDetail,
  DealerFormValues,
  DealerLeaderRow,
} from "@/modules/dms/dealers/schema";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
} from "@/modules/dms/vehicles/schema";

// Lifecycle stages that count as "in the pipeline to a dealer" (not yet sold).
const PIPELINE_STATUSES = ["ALLOCATED", "IN_TRANSIT", "AT_DEALER", "PDI_DONE"];

// Six-month delivery trend across the dealer network.
function deliveriesByMonth(
  rows: { deliveredAt: Date | null }[],
): { name: string; value: number }[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en-US", { month: "short" }),
    };
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.deliveredAt) continue;
    const d = r.deliveredAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((m) => ({ name: m.name, value: counts.get(m.key) ?? 0 }));
}

const SORTABLE = ["code", "name", "city", "createdAt"] as const;

type Row = Prisma.DealerGetPayload<{ include: { _count: { select: { vehicles: true } } } }>;

function toItem(r: Row): Dealer {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    logoUrl: r.logoUrl,
    legalName: r.legalName,
    contactPerson: r.contactPerson,
    phone: r.phone,
    email: r.email,
    gstin: r.gstin,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    city: r.city,
    state: r.state,
    country: r.country,
    postalCode: r.postalCode,
    disabled: r.disabled,
    vehicleCount: r._count.vehicles,
  };
}

function toData(v: DealerFormValues) {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    logoUrl: v.logoUrl?.trim() || null,
    legalName: v.legalName?.trim() || null,
    contactPerson: v.contactPerson?.trim() || null,
    phone: v.phone?.trim() || null,
    email: v.email?.trim() || null,
    gstin: v.gstin?.trim() || null,
    addressLine1: v.addressLine1?.trim() || null,
    addressLine2: v.addressLine2?.trim() || null,
    city: v.city?.trim() || null,
    state: v.state?.trim() || null,
    country: v.country?.trim() || null,
    postalCode: v.postalCode?.trim() || null,
    disabled: v.disabled,
  };
}

export async function listDealers(
  p: ListParams,
): Promise<ListResponse<Dealer>> {
  const where: Prisma.DealerWhereInput = p.search
    ? {
        OR: [
          { code: { contains: p.search, mode: "insensitive" } },
          { name: { contains: p.search, mode: "insensitive" } },
          { city: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { name: "asc" });

  const [rows, total] = await Promise.all([
    prisma.dealer.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { vehicles: true } } },
    }),
    prisma.dealer.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

// Management insights for the Dealers list header.
export async function dealerAnalytics(): Promise<DealerAnalytics> {
  const [dealers, deliveredRows] = await Promise.all([
    prisma.dealer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        city: true,
        state: true,
        disabled: true,
        vehicles: {
          select: { status: true, sellingRate: true, deliveredAt: true },
        },
        allocationRequests: {
          select: { qty: true, qtyAllocated: true, status: true },
        },
      },
    }),
    // Delivered vehicles across the network, for the 6-month trend.
    prisma.vehicle.findMany({
      where: { dealerId: { not: null }, deliveredAt: { not: null } },
      select: { deliveredAt: true },
    }),
  ]);

  const regionCounts = new Map<string, number>();
  let vehiclesAssigned = 0;
  let delivered = 0;
  let deliveredValue = 0;
  let pipeline = 0;
  let openDemand = 0;

  const leaderboard: DealerLeaderRow[] = dealers.map((d) => {
    let dDelivered = 0;
    let dPipeline = 0;
    let dValue = 0;
    for (const v of d.vehicles) {
      if (v.deliveredAt) {
        dDelivered++;
        dValue += Number(v.sellingRate);
      } else if (PIPELINE_STATUSES.includes(v.status)) {
        dPipeline++;
      }
    }
    let dDemand = 0;
    for (const a of d.allocationRequests)
      if (a.status === "PENDING" || a.status === "PARTIAL")
        dDemand += Math.max(0, a.qty - a.qtyAllocated);

    vehiclesAssigned += d.vehicles.length;
    delivered += dDelivered;
    deliveredValue += dValue;
    pipeline += dPipeline;
    openDemand += dDemand;

    const region = d.state?.trim() || "Unspecified";
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);

    return {
      id: d.id,
      code: d.code,
      name: d.name,
      city: d.city,
      state: d.state,
      assigned: d.vehicles.length,
      delivered: dDelivered,
      pipeline: dPipeline,
      deliveredValue: dValue,
      openDemand: dDemand,
    };
  });

  const byDealer = [...leaderboard]
    .filter((d) => d.assigned > 0)
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 6)
    .map((d) => ({ name: d.name, value: d.assigned }));

  const topByValue = [...leaderboard]
    .filter((d) => d.deliveredValue > 0)
    .sort((a, b) => b.deliveredValue - a.deliveredValue)
    .slice(0, 6)
    .map((d) => ({ name: d.name, value: d.deliveredValue }));

  const byRegion = [...regionCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const leaderboardSorted = [...leaderboard]
    .sort(
      (a, b) =>
        b.deliveredValue - a.deliveredValue ||
        b.delivered - a.delivered ||
        b.assigned - a.assigned,
    )
    .slice(0, 8);

  return {
    total: dealers.length,
    active: dealers.filter((d) => !d.disabled).length,
    vehiclesAssigned,
    delivered,
    deliveredValue,
    pipeline,
    openDemand,
    byDealer,
    byRegion,
    topByValue,
    deliveriesByMonth: deliveriesByMonth(deliveredRows),
    leaderboard: leaderboardSorted,
  };
}

export async function dealerDetail(id: string): Promise<DealerDetail | null> {
  const d = await prisma.dealer.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          vin: true,
          model: true,
          variant: true,
          status: true,
          sellingRate: true,
          deliveredAt: true,
          imageUrl: true,
        },
      },
      allocationRequests: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          model: true,
          variant: true,
          qty: true,
          qtyAllocated: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
    },
  });
  if (!d) return null;

  let delivered = 0;
  let deliveredValue = 0;
  let pipeline = 0;
  const statusCounts = new Map<string, number>();
  for (const v of d.vehicles) {
    statusCounts.set(v.status, (statusCounts.get(v.status) ?? 0) + 1);
    if (v.deliveredAt) {
      delivered++;
      deliveredValue += Number(v.sellingRate);
    } else if (PIPELINE_STATUSES.includes(v.status)) {
      pipeline++;
    }
  }

  const byStatus = VEHICLE_STATUSES.filter((s) => statusCounts.get(s)).map(
    (s) => ({ name: VEHICLE_STATUS_LABELS[s], value: statusCounts.get(s) ?? 0 }),
  );

  const demand = d.allocationRequests
    .filter((a) => a.status === "PENDING" || a.status === "PARTIAL")
    .map((a) => ({
      id: a.id,
      name: a.name,
      model: a.model,
      variant: a.variant,
      qty: a.qty,
      qtyAllocated: a.qtyAllocated,
      status: a.status,
      priority: a.priority,
      createdAt: a.createdAt.toISOString(),
    }));
  const openDemand = demand.reduce(
    (s, a) => s + Math.max(0, a.qty - a.qtyAllocated),
    0,
  );

  return {
    id: d.id,
    code: d.code,
    name: d.name,
    logoUrl: d.logoUrl,
    legalName: d.legalName,
    contactPerson: d.contactPerson,
    phone: d.phone,
    email: d.email,
    gstin: d.gstin,
    addressLine1: d.addressLine1,
    addressLine2: d.addressLine2,
    city: d.city,
    state: d.state,
    country: d.country,
    postalCode: d.postalCode,
    disabled: d.disabled,
    vehicleCount: d.vehicles.length,
    createdAt: d.createdAt.toISOString(),
    assigned: d.vehicles.length,
    pipeline,
    delivered,
    deliveredValue,
    openDemand,
    byStatus,
    deliveriesByMonth: deliveriesByMonth(d.vehicles),
    demand,
    recentVehicles: d.vehicles.slice(0, 8).map((v) => ({
      id: v.id,
      vin: v.vin,
      model: v.model,
      variant: v.variant,
      status: v.status,
      sellingRate: Number(v.sellingRate),
      deliveredAt: v.deliveredAt ? v.deliveredAt.toISOString() : null,
      imageUrl: v.imageUrl,
    })),
  };
}

export async function dealerOptions() {
  const rows = await prisma.dealer.findMany({
    where: { disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
  return rows;
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  const r = await prisma.dealer.findUnique({
    where: { id },
    include: { _count: { select: { vehicles: true } } },
  });
  return r ? toItem(r) : null;
}

export async function createDealer(values: DealerFormValues): Promise<Dealer> {
  const code = values.code.trim();
  const dupe = await prisma.dealer.findUnique({ where: { code } });
  if (dupe) throw new Error(`Dealer code "${code}" already exists`);
  const r = await prisma.dealer.create({
    data: toData(values),
    include: { _count: { select: { vehicles: true } } },
  });
  return toItem(r);
}

export async function updateDealer(
  id: string,
  values: DealerFormValues,
): Promise<Dealer> {
  const existing = await prisma.dealer.findUnique({ where: { id } });
  if (!existing) throw new Error("Dealer not found");
  const code = values.code.trim();
  if (code !== existing.code) {
    const dupe = await prisma.dealer.findUnique({ where: { code } });
    if (dupe) throw new Error(`Dealer code "${code}" already exists`);
  }
  const r = await prisma.dealer.update({
    where: { id },
    data: toData(values),
    include: { _count: { select: { vehicles: true } } },
  });
  return toItem(r);
}

export async function deleteDealer(id: string): Promise<void> {
  // The Vehicle→Dealer FK is ON DELETE SET NULL, so a raw delete would silently
  // unassign vehicles — check explicitly and refuse instead.
  const assigned = await prisma.vehicle.count({ where: { dealerId: id } });
  if (assigned > 0)
    throw new Error(
      "Can't delete — this dealer has vehicles assigned. Reassign them or disable the dealer instead.",
    );
  await prisma.dealer.delete({ where: { id } });
}
