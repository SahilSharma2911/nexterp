import type { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Vehicle,
  VehicleFormValues,
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

export async function deleteVehicle(id: string): Promise<void> {
  await prisma.vehicle.delete({ where: { id } });
}
