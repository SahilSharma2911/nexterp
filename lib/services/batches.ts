import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postStockLedger } from "@/lib/stock-ledger";
import { batchOnHand } from "@/lib/batch-stock";
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
const RECEIPT_VT = "Batch Receipt";

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
  include: {
    item: { select: { itemCode: true; itemName: true } };
    warehouse: { select: { warehouseName: true } };
  };
}>;

const INCLUDE = {
  item: { select: { itemCode: true, itemName: true } },
  warehouse: { select: { warehouseName: true } },
} as const;

function toListItem(r: Row, onHand: number): BatchListItem {
  const { status, days } = expiryOf(r.expiryDate);
  return {
    id: r.id,
    batchNo: r.batchNo,
    barcode: r.barcode,
    itemId: r.itemId,
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    warehouseId: r.warehouseId,
    warehouseName: r.warehouse?.warehouseName ?? null,
    mfgDate: r.mfgDate ? r.mfgDate.toISOString() : null,
    expiryDate: r.expiryDate ? r.expiryDate.toISOString() : null,
    qty: r.qty,
    onHand,
    supplier: r.supplier,
    expiry: status,
    daysToExpiry: days,
  };
}

function toDetail(r: Row, onHand: number): Batch {
  return { ...toListItem(r, onHand), notes: r.notes, createdAt: r.createdAt.toISOString() };
}

function toData(v: BatchFormValues) {
  return {
    itemId: v.itemId,
    warehouseId: v.warehouseId?.trim() || null,
    batchNo: v.batchNo.trim(),
    barcode: v.barcode?.trim() || null,
    mfgDate: v.mfgDate ? new Date(v.mfgDate) : null,
    expiryDate: v.expiryDate ? new Date(v.expiryDate) : null,
    qty: v.qty,
    supplier: v.supplier?.trim() || null,
    notes: v.notes?.trim() || null,
  };
}

// On-hand summed from the ledger for a set of batch ids (one query).
async function onHandForIds(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.stockLedgerEntry.groupBy({
    by: ["batchId"],
    where: { batchId: { in: ids }, isCancelled: false },
    _sum: { actualQty: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) if (r.batchId) m.set(r.batchId, r._sum.actualQty ?? 0);
  return m;
}

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
      include: INCLUDE,
    }),
    prisma.batch.count({ where }),
  ]);

  const oh = await onHandForIds(rows.map((r) => r.id));
  return {
    rows: rows.map((r) => toListItem(r, oh.get(r.id) ?? 0)),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function batchAnalytics(): Promise<BatchAnalytics> {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * DAY);

  const [total, expired, expiring, soonRows] = await Promise.all([
    prisma.batch.count(),
    prisma.batch.count({ where: { expiryDate: { lt: now } } }),
    prisma.batch.count({ where: { expiryDate: { gte: now, lte: soon } } }),
    prisma.batch.findMany({
      where: { expiryDate: { gte: now, lte: soon } },
      orderBy: { expiryDate: "asc" },
      take: 8,
      include: INCLUDE,
    }),
  ]);

  // Units tracked = total on-hand across every batch (live from the ledger).
  const onHandAgg = await prisma.stockLedgerEntry.aggregate({
    where: { isCancelled: false, batchId: { not: null } },
    _sum: { actualQty: true },
  });
  const oh = await onHandForIds(soonRows.map((r) => r.id));

  return {
    total,
    expired,
    expiring,
    fresh: total - expired - expiring,
    totalQty: Math.max(0, onHandAgg._sum.actualQty ?? 0),
    expiringSoon: soonRows.map((r) => toListItem(r, oh.get(r.id) ?? 0)),
  };
}

async function oneOnHand(id: string): Promise<number> {
  const agg = await prisma.stockLedgerEntry.aggregate({
    where: { batchId: id, isCancelled: false },
    _sum: { actualQty: true },
  });
  return agg._sum.actualQty ?? 0;
}

export async function getBatchById(id: string): Promise<Batch | null> {
  const r = await prisma.batch.findUnique({ where: { id }, include: INCLUDE });
  if (!r) return null;
  return toDetail(r, await oneOnHand(id));
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
    include: INCLUDE,
  });
  if (!r) return null;
  return toDetail(r, await oneOnHand(r.id));
}

export async function batchesForItem(itemId: string): Promise<BatchListItem[]> {
  const rows = await prisma.batch.findMany({
    where: { itemId },
    orderBy: { expiryDate: "asc" },
    include: INCLUDE,
  });
  const oh = await batchOnHand(itemId);
  return rows.map((r) => toListItem(r, oh.get(r.id) ?? 0));
}

export async function createBatch(values: BatchFormValues): Promise<Batch> {
  const dupe = await prisma.batch.findFirst({
    where: { itemId: values.itemId, batchNo: values.batchNo.trim() },
  });
  if (dupe)
    throw new Error(
      `Batch "${values.batchNo.trim()}" already exists for this item`,
    );

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id: values.itemId },
      select: { valuationRate: true },
    });
    if (!item) throw new Error("Item not found");

    const r = await tx.batch.create({ data: toData(values), include: INCLUDE });

    let onHand = 0;
    // Receiving a lot with a warehouse + qty posts a real stock receipt,
    // attributed to the batch — so the batch becomes genuine on-hand stock.
    if (values.warehouseId && values.qty > 0) {
      await postStockLedger(tx, {
        itemId: values.itemId,
        warehouseId: values.warehouseId,
        actualQty: values.qty,
        incomingRate: Number(item.valuationRate),
        voucherType: RECEIPT_VT,
        voucherNo: r.batchNo,
        voucherDetailId: r.id,
        batchId: r.id,
        postingAt: new Date(),
      });
      onHand = values.qty;
    }
    return toDetail(r, onHand);
  });
}

export async function updateBatch(
  id: string,
  values: BatchFormValues,
): Promise<Batch> {
  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) throw new Error("Batch not found");
  // Editing metadata only — quantity on-hand is driven by the ledger, not this
  // field, so edits here never silently move stock.
  const r = await prisma.batch.update({
    where: { id },
    data: toData(values),
    include: INCLUDE,
  });
  return toDetail(r, await oneOnHand(id));
}

export async function deleteBatch(id: string): Promise<void> {
  const movements = await prisma.stockLedgerEntry.count({
    where: { batchId: id },
  });
  if (movements > 0)
    throw new Error(
      "Can't delete — this batch has stock movements in the ledger.",
    );
  await prisma.batch.delete({ where: { id } });
}
