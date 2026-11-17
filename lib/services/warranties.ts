import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import {
  COMPONENT_LABELS,
  type Warranty,
  type WarrantyFormValues,
  type WarrantyOption,
} from "@/modules/dms/warranties/schema";
import { warrantyExpiry, daysBetween } from "@/lib/services/warranty-eligibility";

const SORTABLE = ["startDate", "component", "status", "createdAt"] as const;

type Row = Prisma.WarrantyGetPayload<{
  include: {
    vehicle: { select: { vin: true; model: true } };
    _count: { select: { claims: true } };
  };
}>;

const INCLUDE = {
  vehicle: { select: { vin: true, model: true } },
  _count: { select: { claims: true } },
} satisfies Prisma.WarrantyInclude;

function toItem(r: Row): Warranty {
  const now = new Date();
  const expiry = warrantyExpiry(r.startDate, r.months);
  const active = r.status === "ACTIVE" && now <= expiry;
  const daysLeft = Math.max(0, daysBetween(now, expiry));
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    vehicle: r.vehicle.vin,
    vehicleModel: r.vehicle.model,
    component: r.component,
    startDate: r.startDate.toISOString(),
    months: r.months,
    kmLimit: r.kmLimit,
    soHThreshold: r.soHThreshold,
    status: r.status,
    notes: r.notes,
    expiryDate: expiry.toISOString(),
    active,
    daysLeft,
    claimCount: r._count.claims,
  };
}

function toData(v: WarrantyFormValues) {
  return {
    vehicleId: v.vehicleId,
    component: v.component,
    startDate: new Date(v.startDate),
    months: Number(v.months),
    kmLimit: v.kmLimit == null ? null : Number(v.kmLimit),
    soHThreshold: v.soHThreshold == null ? null : Number(v.soHThreshold),
    status: v.status,
    notes: v.notes?.trim() || null,
  };
}

export async function listWarranties(
  p: ListParams,
  filters: { status?: string; component?: string; vehicleId?: string },
): Promise<ListResponse<Warranty>> {
  const where: Prisma.WarrantyWhereInput = {};

  if (filters.status && filters.status !== "all")
    where.status = filters.status as Row["status"];
  if (filters.component && filters.component !== "all")
    where.component = filters.component as Row["component"];
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;

  if (p.search) {
    where.OR = [
      { vehicle: { vin: { contains: p.search, mode: "insensitive" } } },
      { notes: { contains: p.search, mode: "insensitive" } },
    ];
  }

  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.warranty.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE,
    }),
    prisma.warranty.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function warrantyOptions(
  vehicleId?: string,
): Promise<WarrantyOption[]> {
  const rows = await prisma.warranty.findMany({
    where: { status: "ACTIVE", ...(vehicleId ? { vehicleId } : {}) },
    orderBy: { startDate: "desc" },
    include: { vehicle: { select: { vin: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    component: r.component,
    label: `${r.vehicle.vin} · ${COMPONENT_LABELS[r.component]}`,
  }));
}

export async function getWarrantyById(id: string): Promise<Warranty | null> {
  const r = await prisma.warranty.findUnique({
    where: { id },
    include: INCLUDE,
  });
  return r ? toItem(r) : null;
}

export async function createWarranty(
  values: WarrantyFormValues,
): Promise<Warranty> {
  const r = await prisma.warranty.create({
    data: toData(values),
    include: INCLUDE,
  });
  return toItem(r);
}

export async function updateWarranty(
  id: string,
  values: WarrantyFormValues,
): Promise<Warranty> {
  const existing = await prisma.warranty.findUnique({ where: { id } });
  if (!existing) throw new Error("Warranty not found");
  const r = await prisma.warranty.update({
    where: { id },
    data: toData(values),
    include: INCLUDE,
  });
  return toItem(r);
}

export async function deleteWarranty(id: string): Promise<void> {
  try {
    await prisma.warranty.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this warranty has claims. Void it instead.",
    );
  }
}
