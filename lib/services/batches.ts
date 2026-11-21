import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Batch,
  BatchAnalytics,
  BatchFormValues,
  BatchListItem,
  ExpiryStatus,
} from "@/features/batches/schema";

const SORTABLE = ["batchNo", "expiryDate", "qty", "createdAt"] as const;
const EXPIRING_DAYS = 90; // a batch within this many days of expiry is "expiring"

const DAY = 86_400_000;

// Derive shelf-life state from an expiry date relative to today.
function expiryOf(expiryDate: Date | null): {
  status: ExpiryStatus;
  days: number | null;
} {
  if (!expiryDate) return { status: "none", days: null };
  const days = Math.ceil((expiryDate.getTime() - Date.now()) / DAY);
  if (days < 0) return { status: "expired", days };
  if (days <= EXPIRING_DAYS) return { status: "expiring", days };
  return { status: "fresh", days };
}

type Row = Prisma.BatchGetPayload<{
  include: { item: { select: { itemCode: true; itemName: true } } };
}>;

function toListItem(r: Row): BatchListItem {
  const { status, days } = expiryOf(r.expiryDate);
  return {
    id: r.id,
    batchNo: r.batchNo,
    barcode: r.barcode,
    itemId: r.itemId,
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    mfgDate: r.mfgDate ? r.mfgDate.toISOString() : null,
    expiryDate: r.expiryDate ? r.expiryDate.toISOString() : null,
    qty: r.qty,
    supplier: r.supplier,
    expiry: status,
    daysToExpiry: days,
  };
}

function toData(v: BatchFormValues) {
  return {
    itemId: v.itemId,
    batchNo: v.batchNo.trim(),
    barcode: v.barcode?.trim() || null,
    mfgDate: v.mfgDate ? new Date(v.mfgDate) : null,
    expiryDate: v.expiryDate ? new Date(v.expiryDate) : null,
    qty: v.qty,
    supplier: v.supplier?.trim() || null,
    notes: v.notes?.trim() || null,
  };
}

const INCLUDE_ITEM = {
  item: { select: { itemCode: true, itemName: true } },
} as const;

export async function listBatches(
  p: ListParams,
  filters: { itemId?: string; expiry?: string },
): Promise<ListResponse<BatchListItem>> {
  const where: Prisma.BatchWhereInput = {};
  if (filters.itemId) where.itemId = filters.itemId;
  if (p.search)
    where.OR = [
      { batchNo: { contains: p.search, mode: "insensitive" } },
      { barcode: { contains: p.search, mode: "insensitive" } },
      { item: { itemCode: { contains: p.search, mode: "insensitive" } } },
      { item: { itemName: { contains: p.search, mode: "insensitive" } } },
    ];

  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * DAY);
  if (filters.expiry === "expired") where.expiryDate = { lt: now };
  else if (filters.expiry === "expiring")
    where.expiryDate = { gte: now, lte: soon };
  else if (filters.expiry === "fresh") where.expiryDate = { gt: soon };

  const orderBy = parseSort(p.sort, SORTABLE, { expiryDate: "asc" });

  const [rows, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE_ITEM,
    }),
    prisma.batch.count({ where }),
  ]);

  return { rows: rows.map(toListItem), total, page: p.page, limit: p.limit };
}

export async function batchAnalytics(): Promise<BatchAnalytics> {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * DAY);

  const [total, expired, expiring, agg, soonRows] = await Promise.all([
    prisma.batch.count(),
    prisma.batch.count({ where: { expiryDate: { lt: now } } }),
    prisma.batch.count({ where: { expiryDate: { gte: now, lte: soon } } }),
    prisma.batch.aggregate({ _sum: { qty: true } }),
    prisma.batch.findMany({
      where: { expiryDate: { gte: now, lte: soon } },
      orderBy: { expiryDate: "asc" },
      take: 8,
      include: INCLUDE_ITEM,
    }),
  ]);

  return {
    total,
    expired,
    expiring,
    fresh: total - expired - expiring,
    totalQty: agg._sum.qty ?? 0,
    expiringSoon: soonRows.map(toListItem),
  };
}

export async function getBatchById(id: string): Promise<Batch | null> {
  const r = await prisma.batch.findUnique({
    where: { id },
    include: INCLUDE_ITEM,
  });
  if (!r) return null;
  return { ...toListItem(r), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

export async function batchByBarcode(code: string): Promise<Batch | null> {
  const c = code.trim();
  if (!c) return null;
  const r = await prisma.batch.findFirst({
    where: {
      OR: [
        { barcode: { equals: c, mode: "insensitive" } },
        { batchNo: { equals: c, mode: "insensitive" } },
      ],
    },
    include: INCLUDE_ITEM,
  });
  if (!r) return null;
  return { ...toListItem(r), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

export async function batchesForItem(itemId: string): Promise<BatchListItem[]> {
  const rows = await prisma.batch.findMany({
    where: { itemId },
    orderBy: { expiryDate: "asc" },
    include: INCLUDE_ITEM,
  });
  return rows.map(toListItem);
}

export async function createBatch(values: BatchFormValues): Promise<Batch> {
  const dupe = await prisma.batch.findFirst({
    where: { itemId: values.itemId, batchNo: values.batchNo.trim() },
  });
  if (dupe)
    throw new Error(
      `Batch "${values.batchNo.trim()}" already exists for this item`,
    );
  const r = await prisma.batch.create({
    data: toData(values),
    include: INCLUDE_ITEM,
  });
  return { ...toListItem(r), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

export async function updateBatch(
  id: string,
  values: BatchFormValues,
): Promise<Batch> {
  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) throw new Error("Batch not found");
  const r = await prisma.batch.update({
    where: { id },
    data: toData(values),
    include: INCLUDE_ITEM,
  });
  return { ...toListItem(r), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

export async function deleteBatch(id: string): Promise<void> {
  await prisma.batch.delete({ where: { id } });
}
