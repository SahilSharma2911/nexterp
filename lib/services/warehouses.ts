import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Warehouse,
  WarehouseAnalytics,
  WarehouseFormValues,
} from "@/features/warehouses/schema";

const SORTABLE = ["warehouseName", "warehouseType", "createdAt"] as const;

// Management insights for the Warehouses list header.
export async function warehouseAnalytics(): Promise<WarehouseAnalytics> {
  const [total, stockVal, byWh, stockedItems, whRows] = await Promise.all([
    prisma.warehouse.count(),
    prisma.bin.aggregate({ _sum: { stockValue: true } }),
    prisma.bin.groupBy({ by: ["warehouseId"], _sum: { stockValue: true } }),
    prisma.bin.groupBy({ by: ["itemId"], where: { actualQty: { gt: 0 } } }),
    prisma.warehouse.findMany({ select: { id: true, warehouseName: true } }),
  ]);
  const nameOf = new Map(whRows.map((w) => [w.id, w.warehouseName]));
  const byWarehouse = byWh
    .map((b) => ({
      name: nameOf.get(b.warehouseId) ?? "—",
      value: Number(b._sum.stockValue ?? 0),
    }))
    .filter((w) => w.value !== 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    total,
    itemsStocked: stockedItems.length,
    stockValue: Number(stockVal._sum.stockValue ?? 0),
    byWarehouse,
  };
}

type Row = Prisma.WarehouseGetPayload<object>;

function toItem(r: Row): Warehouse {
  return {
    id: r.id,
    warehouseName: r.warehouseName,
    warehouseType: r.warehouseType,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    city: r.city,
    state: r.state,
    country: r.country,
    postalCode: r.postalCode,
    phone: r.phone,
    email: r.email,
    contactPerson: r.contactPerson,
    disabled: r.disabled,
  };
}

function toData(v: WarehouseFormValues) {
  return {
    warehouseName: v.warehouseName.trim(),
    warehouseType: v.warehouseType?.trim() || null,
    addressLine1: v.addressLine1?.trim() || null,
    addressLine2: v.addressLine2?.trim() || null,
    city: v.city?.trim() || null,
    state: v.state?.trim() || null,
    country: v.country?.trim() || null,
    postalCode: v.postalCode?.trim() || null,
    phone: v.phone?.trim() || null,
    email: v.email?.trim() || null,
    contactPerson: v.contactPerson?.trim() || null,
    disabled: v.disabled,
  };
}

export async function listWarehouses(
  p: ListParams,
): Promise<ListResponse<Warehouse>> {
  const where: Prisma.WarehouseWhereInput = p.search
    ? {
        OR: [
          { warehouseName: { contains: p.search, mode: "insensitive" } },
          { warehouseType: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { warehouseName: "asc" });

  const [rows, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.warehouse.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function warehouseOptions() {
  const rows = await prisma.warehouse.findMany({
    where: { disabled: false },
    orderBy: { warehouseName: "asc" },
    select: { id: true, warehouseName: true },
  });
  return rows;
}

export async function getWarehouseById(id: string): Promise<Warehouse | null> {
  const r = await prisma.warehouse.findUnique({ where: { id } });
  return r ? toItem(r) : null;
}

export async function createWarehouse(
  values: WarehouseFormValues,
): Promise<Warehouse> {
  const name = values.warehouseName.trim();
  const dupe = await prisma.warehouse.findUnique({
    where: { warehouseName: name },
  });
  if (dupe) throw new Error(`Warehouse "${name}" already exists`);
  const r = await prisma.warehouse.create({ data: toData(values) });
  return toItem(r);
}

export async function updateWarehouse(
  id: string,
  values: WarehouseFormValues,
): Promise<Warehouse> {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new Error("Warehouse not found");
  const name = values.warehouseName.trim();
  if (name !== existing.warehouseName) {
    const dupe = await prisma.warehouse.findUnique({
      where: { warehouseName: name },
    });
    if (dupe) throw new Error(`Warehouse "${name}" already exists`);
  }
  const r = await prisma.warehouse.update({
    where: { id },
    data: toData(values),
  });
  return toItem(r);
}

export async function deleteWarehouse(id: string): Promise<void> {
  try {
    await prisma.warehouse.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this warehouse has stock or transactions. Disable it instead.",
    );
  }
}
