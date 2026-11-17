import type { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { warrantyExpiry } from "@/lib/services/warranty-eligibility";
import { COMPONENT_LABELS } from "@/modules/dms/warranties/schema";
import type {
  Vehicle,
  VehicleFormValues,
  VehicleRelated,
} from "@/modules/dms/vehicles/schema";

const SORTABLE = ["vin", "model", "status", "batterySoH", "createdAt"] as const;

type Row = Prisma.VehicleGetPayload<{
  include: { dealer: { select: { name: true } } };
}>;

const WITH_DEALER = { dealer: { select: { name: true } } } as const;

// Resolve core Warehouse names for a set of ids. The DMS module references the
// core by id only; it never imports core Warehouse models into its own types.
async function warehouseNames(
  ids: (string | null)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map();
  const rows = await prisma.warehouse.findMany({
    where: { id: { in: unique } },
    select: { id: true, warehouseName: true },
  });
  return new Map(rows.map((r) => [r.id, r.warehouseName]));
}

function toItem(r: Row, wh: Map<string, string>): Vehicle {
  return {
    id: r.id,
    vin: r.vin,
    model: r.model,
    variant: r.variant,
    color: r.color,
    motorSerial: r.motorSerial,
    batterySerial: r.batterySerial,
    batterySoH: r.batterySoH,
    status: r.status,
    mfgDate: r.mfgDate ? r.mfgDate.toISOString() : null,
    purchaseRate: Number(r.purchaseRate),
    sellingRate: Number(r.sellingRate),
    warehouseId: r.warehouseId,
    warehouse: r.warehouseId ? (wh.get(r.warehouseId) ?? null) : null,
    dealerId: r.dealerId,
    dealer: r.dealer?.name ?? null,
    imageUrl: r.imageUrl,
    remarks: r.remarks,
  };
}

function toData(v: VehicleFormValues) {
  return {
    vin: v.vin.trim(),
    model: v.model.trim(),
    variant: v.variant?.trim() || null,
    color: v.color?.trim() || null,
    motorSerial: v.motorSerial?.trim() || null,
    batterySerial: v.batterySerial?.trim() || null,
    batterySoH: v.batterySoH ?? null,
    status: v.status as VehicleStatus,
    mfgDate: v.mfgDate ? new Date(v.mfgDate) : null,
    purchaseRate: v.purchaseRate,
    sellingRate: v.sellingRate,
    warehouseId: v.warehouseId || null,
    dealerId: v.dealerId || null,
    imageUrl: v.imageUrl?.trim() || null,
    remarks: v.remarks?.trim() || null,
  };
}

export async function listVehicles(
  p: ListParams,
  filters: { status?: string; dealerId?: string },
): Promise<ListResponse<Vehicle>> {
  const where: Prisma.VehicleWhereInput = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status as VehicleStatus;
  }
  if (filters.dealerId) {
    where.dealerId = filters.dealerId;
  }
  if (p.search) {
    where.OR = [
      { vin: { contains: p.search, mode: "insensitive" } },
      { model: { contains: p.search, mode: "insensitive" } },
      { batterySerial: { contains: p.search, mode: "insensitive" } },
      { motorSerial: { contains: p.search, mode: "insensitive" } },
    ];
  }
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: WITH_DEALER,
    }),
    prisma.vehicle.count({ where }),
  ]);

  const wh = await warehouseNames(rows.map((r) => r.warehouseId));
  return {
    rows: rows.map((r) => toItem(r, wh)),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function vehicleOptions() {
  return prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, vin: true, model: true },
    take: 500,
  });
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const r = await prisma.vehicle.findUnique({
    where: { id },
    include: WITH_DEALER,
  });
  if (!r) return null;
  const wh = await warehouseNames([r.warehouseId]);
  return toItem(r, wh);
}

export async function createVehicle(
  values: VehicleFormValues,
): Promise<Vehicle> {
  const vin = values.vin.trim();
  const dupe = await prisma.vehicle.findUnique({ where: { vin } });
  if (dupe) throw new Error(`A vehicle with VIN "${vin}" already exists`);
  const r = await prisma.vehicle.create({
    data: toData(values),
    include: WITH_DEALER,
  });
  const wh = await warehouseNames([r.warehouseId]);
  return toItem(r, wh);
}

export async function updateVehicle(
  id: string,
  values: VehicleFormValues,
): Promise<Vehicle> {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) throw new Error("Vehicle not found");
  const vin = values.vin.trim();
  if (vin !== existing.vin) {
    const dupe = await prisma.vehicle.findUnique({ where: { vin } });
    if (dupe) throw new Error(`A vehicle with VIN "${vin}" already exists`);
  }
  const r = await prisma.vehicle.update({
    where: { id },
    data: toData(values),
    include: WITH_DEALER,
  });
  const wh = await warehouseNames([r.warehouseId]);
  return toItem(r, wh);
}

// A vehicle's full DMS history across modules — service, warranty, subsidy.
export async function getVehicleRelated(id: string): Promise<VehicleRelated> {
  const [jobCards, warranties, subsidyClaims] = await Promise.all([
    prisma.jobCard.findMany({
      where: { vehicleId: id },
      orderBy: { serviceDate: "desc" },
      take: 20,
      select: { id: true, name: true, status: true, serviceDate: true, total: true },
    }),
    prisma.warranty.findMany({
      where: { vehicleId: id },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        component: true,
        status: true,
        startDate: true,
        months: true,
      },
    }),
    prisma.subsidyClaim.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { scheme: { select: { code: true } } },
    }),
  ]);
  const now = new Date();
  return {
    jobCards: jobCards.map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      serviceDate: j.serviceDate.toISOString(),
      total: Number(j.total),
    })),
    warranties: warranties.map((w) => {
      const exp = warrantyExpiry(w.startDate, w.months);
      return {
        id: w.id,
        component: COMPONENT_LABELS[w.component],
        status: w.status,
        expiryDate: exp.toISOString(),
        active: w.status === "ACTIVE" && now <= exp,
      };
    }),
    subsidyClaims: subsidyClaims.map((s) => ({
      id: s.id,
      name: s.name,
      scheme: s.scheme.code,
      status: s.status,
      claimAmount: Number(s.claimAmount),
    })),
  };
}

export async function deleteVehicle(id: string): Promise<void> {
  const [jobs, warranties, subsidies] = await Promise.all([
    prisma.jobCard.count({ where: { vehicleId: id } }),
    prisma.warranty.count({ where: { vehicleId: id } }),
    prisma.subsidyClaim.count({ where: { vehicleId: id } }),
  ]);
  if (jobs + warranties + subsidies > 0)
    throw new Error(
      "Can't delete — this vehicle has job cards, warranties or subsidy claims. Reassign or remove them first.",
    );
  await prisma.vehicle.delete({ where: { id } });
}
