import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Serial,
  SerialAnalytics,
  SerialFormValues,
  SerialListItem,
} from "@/features/serials/schema";

const SORTABLE = ["serialNo", "status", "createdAt"] as const;

type Row = Prisma.SerialNoGetPayload<{
  include: {
    item: { select: { itemCode: true; itemName: true } };
    warehouse: { select: { warehouseName: true } };
  };
}>;

const INCLUDE = {
  item: { select: { itemCode: true, itemName: true } },
  warehouse: { select: { warehouseName: true } },
} as const;

function toListItem(r: Row): SerialListItem {
  return {
    id: r.id,
    serialNo: r.serialNo,
    barcode: r.barcode,
    itemId: r.itemId,
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    warehouseId: r.warehouseId,
    warehouseName: r.warehouse?.warehouseName ?? null,
    status: r.status,
  };
}

function toDetail(r: Row): Serial {
  return { ...toListItem(r), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

function toData(v: SerialFormValues) {
  return {
    itemId: v.itemId,
    serialNo: v.serialNo.trim(),
    warehouseId: v.warehouseId?.trim() || null,
    barcode: v.barcode?.trim() || null,
    status: v.status,
    notes: v.notes?.trim() || null,
  };
}

export async function listSerials(
  p: ListParams,
  filters: { itemId?: string; status?: string },
): Promise<ListResponse<SerialListItem>> {
  const where: Prisma.SerialNoWhereInput = {};
  if (filters.itemId) where.itemId = filters.itemId;
  if (filters.status && filters.status !== "all")
    where.status = filters.status as SerialListItem["status"];
  if (p.search)
    where.OR = [
      { serialNo: { contains: p.search, mode: "insensitive" } },
      { barcode: { contains: p.search, mode: "insensitive" } },
      { item: { itemCode: { contains: p.search, mode: "insensitive" } } },
      { item: { itemName: { contains: p.search, mode: "insensitive" } } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.serialNo.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE,
    }),
    prisma.serialNo.count({ where }),
  ]);
  return { rows: rows.map(toListItem), total, page: p.page, limit: p.limit };
}

export async function serialAnalytics(): Promise<SerialAnalytics> {
  const grouped = await prisma.serialNo.groupBy({
    by: ["status"],
    _count: true,
  });
  const countFor = (s: string) =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  return {
    total: grouped.reduce((n, g) => n + g._count, 0),
    inStock: countFor("IN_STOCK"),
    delivered: countFor("DELIVERED"),
    scrapped: countFor("SCRAPPED"),
  };
}

export async function getSerialById(id: string): Promise<Serial | null> {
  const r = await prisma.serialNo.findUnique({ where: { id }, include: INCLUDE });
  return r ? toDetail(r) : null;
}

export async function serialByBarcode(code: string): Promise<Serial | null> {
  const c = code.trim();
  if (!c) return null;
  const r = await prisma.serialNo.findFirst({
    where: {
      OR: [
        { barcode: { equals: c, mode: "insensitive" } },
        { serialNo: { equals: c, mode: "insensitive" } },
      ],
    },
    include: INCLUDE,
  });
  return r ? toDetail(r) : null;
}

export async function serialsForItem(itemId: string): Promise<SerialListItem[]> {
  const rows = await prisma.serialNo.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    include: INCLUDE,
  });
  return rows.map(toListItem);
}

export async function createSerial(values: SerialFormValues): Promise<Serial> {
  const dupe = await prisma.serialNo.findFirst({
    where: { itemId: values.itemId, serialNo: values.serialNo.trim() },
  });
  if (dupe)
    throw new Error(
      `Serial "${values.serialNo.trim()}" already exists for this item`,
    );
  const r = await prisma.serialNo.create({ data: toData(values), include: INCLUDE });
  return toDetail(r);
}

export async function updateSerial(
  id: string,
  values: SerialFormValues,
): Promise<Serial> {
  const existing = await prisma.serialNo.findUnique({ where: { id } });
  if (!existing) throw new Error("Serial not found");
  const r = await prisma.serialNo.update({
    where: { id },
    data: toData(values),
    include: INCLUDE,
  });
  return toDetail(r);
}

export async function deleteSerial(id: string): Promise<void> {
  await prisma.serialNo.delete({ where: { id } });
}
