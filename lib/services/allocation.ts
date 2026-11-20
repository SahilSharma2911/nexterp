import { prisma } from "@/lib/prisma";
import { allocateVehicle } from "@/lib/services/vehicle-lifecycle";
import type {
  AllocationActivityItem,
  AllocationPlan,
  AllocationRequestFormValues,
  AllocationRequestRow,
  AllocationRule,
  AllocationRuleFormValues,
} from "@/modules/dms/allocation/schema";

const ageDays = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);

// ---- Rules (single editable config row) ----

async function ruleRow() {
  const r = await prisma.allocationRule.findFirst();
  return r ?? (await prisma.allocationRule.create({ data: {} }));
}

export async function getAllocationRule(): Promise<AllocationRule> {
  const r = await ruleRow();
  return {
    oldestFirst: r.oldestFirst,
    matchModel: r.matchModel,
    matchVariant: r.matchVariant,
    maxAgeDays: r.maxAgeDays,
  };
}

export async function updateAllocationRule(
  v: AllocationRuleFormValues,
): Promise<AllocationRule> {
  const existing = await ruleRow();
  const r = await prisma.allocationRule.update({
    where: { id: existing.id },
    data: {
      oldestFirst: v.oldestFirst,
      matchModel: v.matchModel,
      matchVariant: v.matchVariant,
      maxAgeDays: v.maxAgeDays ?? null,
    },
  });
  return {
    oldestFirst: r.oldestFirst,
    matchModel: r.matchModel,
    matchVariant: r.matchVariant,
    maxAgeDays: r.maxAgeDays,
  };
}

// ---- Requests (dealer demand) ----

function toRow(r: {
  id: string;
  name: string;
  dealerId: string;
  dealer: { name: string };
  model: string;
  variant: string | null;
  qty: number;
  qtyAllocated: number;
  priority: number;
  status: AllocationRequestRow["status"];
  note: string | null;
  createdAt: Date;
}): AllocationRequestRow {
  return {
    id: r.id,
    name: r.name,
    dealerId: r.dealerId,
    dealer: r.dealer.name,
    model: r.model,
    variant: r.variant,
    qty: r.qty,
    qtyAllocated: r.qtyAllocated,
    priority: r.priority,
    status: r.status,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listAllocationRequests(filters: {
  status?: string;
}): Promise<AllocationRequestRow[]> {
  const rows = await prisma.allocationRequest.findMany({
    where:
      filters.status && filters.status !== "all"
        ? {
            status:
              filters.status as AllocationRequestRow["status"],
          }
        : {},
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
    include: { dealer: { select: { name: true } } },
  });
  return rows.map(toRow);
}

export async function createAllocationRequest(
  v: AllocationRequestFormValues,
): Promise<{ id: string; name: string }> {
  const year = new Date().getFullYear();
  const count = await prisma.allocationRequest.count();
  const name = `ALLOC-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.allocationRequest.create({
    data: {
      name,
      dealerId: v.dealerId,
      model: v.model.trim(),
      variant: v.variant?.trim() || null,
      qty: v.qty,
      priority: v.priority,
      note: v.note?.trim() || null,
    },
  });
  return { id: row.id, name };
}

export async function cancelAllocationRequest(id: string): Promise<void> {
  const r = await prisma.allocationRequest.findUnique({ where: { id } });
  if (!r) throw new Error("Request not found");
  if (r.status === "FULFILLED")
    throw new Error("A fulfilled request can't be cancelled");
  await prisma.allocationRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function deleteAllocationRequest(id: string): Promise<void> {
  const r = await prisma.allocationRequest.findUnique({ where: { id } });
  if (!r) throw new Error("Request not found");
  if (r.qtyAllocated > 0)
    throw new Error(
      "Vehicles were already allocated against this request — cancel it instead.",
    );
  await prisma.allocationRequest.delete({ where: { id } });
}

// ---- The FIFO engine ----

// Match in-stock vehicles to open requests following the rules. Pure read —
// returns a plan to preview before committing.
export async function previewAllocation(): Promise<AllocationPlan> {
  const rule = await ruleRow();
  const requests = await prisma.allocationRequest.findMany({
    where: { status: { in: ["PENDING", "PARTIAL"] } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    include: { dealer: { select: { name: true } } },
  });
  const stock = await prisma.vehicle.findMany({
    where: { status: "IN_STOCK" },
    orderBy: { createdAt: rule.oldestFirst ? "asc" : "desc" },
    select: { id: true, vin: true, model: true, variant: true, createdAt: true },
  });

  const taken = new Set<string>();
  const lines: AllocationPlan["lines"] = [];
  const unmatched: AllocationPlan["unmatched"] = [];

  for (const req of requests) {
    const need = req.qty - req.qtyAllocated;
    if (need <= 0) continue;
    const picks = [];
    for (const v of stock) {
      if (picks.length >= need) break;
      if (taken.has(v.id)) continue;
      if (rule.matchModel && v.model !== req.model) continue;
      if (rule.matchVariant && (v.variant ?? "") !== (req.variant ?? ""))
        continue;
      picks.push(v);
      taken.add(v.id);
    }
    if (picks.length)
      lines.push({
        requestId: req.id,
        requestName: req.name,
        dealer: req.dealer.name,
        model: req.model,
        variant: req.variant,
        need,
        vehicles: picks.map((v) => ({
          id: v.id,
          vin: v.vin,
          model: v.model,
          variant: v.variant,
          daysInStock: ageDays(v.createdAt),
        })),
      });
    if (picks.length < need)
      unmatched.push({
        requestName: req.name,
        dealer: req.dealer.name,
        model: req.model,
        variant: req.variant,
        short: need - picks.length,
      });
  }

  return { lines, totalVehicles: taken.size, unmatched };
}

// Commit the FIFO plan: allocate each matched vehicle to its dealer and advance
// the requests. Recomputes the plan fresh so stale previews can't double-book.
export async function commitAllocation(
  by?: string | null,
): Promise<{ allocated: number; requests: number }> {
  const plan = await previewAllocation();
  let allocated = 0;
  for (const line of plan.lines) {
    const req = await prisma.allocationRequest.findUnique({
      where: { id: line.requestId },
    });
    if (!req || (req.status !== "PENDING" && req.status !== "PARTIAL")) continue;
    for (const v of line.vehicles) {
      await allocateVehicle(
        v.id,
        { dealerId: req.dealerId, note: `FIFO allocation · ${req.name}` },
        by ?? "FIFO engine",
      );
      allocated++;
    }
    const newAlloc = req.qtyAllocated + line.vehicles.length;
    await prisma.allocationRequest.update({
      where: { id: req.id },
      data: {
        qtyAllocated: newAlloc,
        status: newAlloc >= req.qty ? "FULFILLED" : "PARTIAL",
      },
    });
  }
  return { allocated, requests: plan.lines.length };
}

// ---- Activity (recent allocations across the fleet) ----

export async function allocationActivity(): Promise<AllocationActivityItem[]> {
  const events = await prisma.vehicleEvent.findMany({
    where: { stage: "ALLOCATED" },
    orderBy: { at: "desc" },
    take: 12,
    include: { vehicle: { select: { vin: true, model: true } } },
  });
  const dealerIds = [
    ...new Set(events.map((e) => e.dealerId).filter((x): x is string => !!x)),
  ];
  const dealers = dealerIds.length
    ? await prisma.dealer.findMany({
        where: { id: { in: dealerIds } },
        select: { id: true, name: true },
      })
    : [];
  const dealerName = new Map(dealers.map((d) => [d.id, d.name]));
  return events.map((e) => ({
    id: e.id,
    vehicleId: e.vehicleId,
    vin: e.vehicle.vin,
    model: e.vehicle.model,
    dealer: e.dealerId ? (dealerName.get(e.dealerId) ?? null) : null,
    byUser: e.byUser,
    at: e.at.toISOString(),
  }));
}
