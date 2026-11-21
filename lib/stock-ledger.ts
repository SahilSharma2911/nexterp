import { Prisma } from "@prisma/client";

// Port of ERPNext's SLE posting + bin update. Every stock-moving voucher calls
// postStockLedger() inside its own transaction. Valuation = moving average.
// See docs/stock-ledger.md.

export type PostStockParams = {
  itemId: string;
  warehouseId: string;
  // Signed delta: positive = receipt (in), negative = issue (out).
  actualQty: number;
  // Valuation rate for incoming stock (receipts). Ignored for issues.
  incomingRate?: number;
  voucherType: string; // e.g. "Stock Entry"
  voucherNo: string;
  voucherDetailId?: string | null;
  postingAt: Date;
  createdBy?: string | null;
  allowNegative?: boolean;
  // Batch/lot this movement is attributed to (batch-tracked items). Does not
  // affect valuation — that stays at the item + warehouse level.
  batchId?: string | null;
};

export type PostStockResult = {
  qtyAfterTransaction: number;
  valuationRate: number;
  stockValue: number;
  stockValueDifference: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round6 = (n: number) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;

export async function postStockLedger(
  tx: Prisma.TransactionClient,
  p: PostStockParams
): Promise<PostStockResult> {
  if (!p.actualQty || Number.isNaN(p.actualQty)) throw new Error("actualQty must be a non-zero number");

  const bin = await tx.bin.findUnique({
    where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } },
  });
  const prevQty = bin?.actualQty ?? 0;
  const prevRate = bin ? Number(bin.valuationRate) : 0;
  const prevValue = bin ? Number(bin.stockValue) : 0;

  const qtyAfter = round6(prevQty + p.actualQty);
  if (!p.allowNegative && qtyAfter < 0) {
    throw new Error(`Insufficient stock in this warehouse: balance ${prevQty}, change ${p.actualQty}`);
  }

  let newRate = prevRate;
  let newValue: number;
  let valueDiff: number;

  if (p.actualQty > 0) {
    // Receipt — moving-average weighting.
    const inRate = p.incomingRate ?? prevRate;
    const inValue = p.actualQty * inRate;
    newValue = prevValue + inValue;
    newRate = qtyAfter > 0 ? newValue / qtyAfter : inRate;
    valueDiff = inValue;
  } else {
    // Issue — valued at the current moving-average rate.
    valueDiff = p.actualQty * prevRate; // negative
    newValue = prevValue + valueDiff;
    newRate = qtyAfter > 0 ? newValue / qtyAfter : prevRate;
    if (qtyAfter <= 0) newValue = 0;
  }

  newRate = round6(Math.max(0, newRate));
  newValue = round2(Math.max(0, newValue));
  valueDiff = round2(valueDiff);

  await tx.stockLedgerEntry.create({
    data: {
      itemId: p.itemId,
      warehouseId: p.warehouseId,
      postingAt: p.postingAt,
      voucherType: p.voucherType,
      voucherNo: p.voucherNo,
      voucherDetailId: p.voucherDetailId ?? null,
      actualQty: p.actualQty,
      qtyAfterTransaction: qtyAfter,
      incomingRate: p.actualQty > 0 ? round6(p.incomingRate ?? prevRate) : 0,
      valuationRate: newRate,
      stockValue: newValue,
      stockValueDifference: valueDiff,
      batchId: p.batchId ?? null,
      createdBy: p.createdBy ?? null,
    },
  });

  const ordered = bin?.orderedQty ?? 0;
  const planned = bin?.plannedQty ?? 0;
  const reserved = bin?.reservedQty ?? 0;
  const projected = round6(qtyAfter + ordered + planned - reserved);

  await tx.bin.upsert({
    where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } },
    update: { actualQty: qtyAfter, valuationRate: newRate, stockValue: newValue, projectedQty: projected },
    create: {
      itemId: p.itemId,
      warehouseId: p.warehouseId,
      actualQty: qtyAfter,
      valuationRate: newRate,
      stockValue: newValue,
      projectedQty: qtyAfter,
    },
  });

  return { qtyAfterTransaction: qtyAfter, valuationRate: newRate, stockValue: newValue, stockValueDifference: valueDiff };
}

export type SetStockParams = {
  itemId: string;
  warehouseId: string;
  qty: number; // absolute on-hand qty to set
  rate?: number; // absolute valuation rate; defaults to current
  voucherType: string;
  voucherNo: string;
  voucherDetailId?: string | null;
  postingAt: Date;
  createdBy?: string | null;
};

// Set an absolute balance (ERPNext Stock Reconciliation): posts the SLE that
// takes the bin to `qty` at `rate`, and returns the prior values so a cancel
// can restore them. Returns null when nothing changed.
export async function setStockBalance(
  tx: Prisma.TransactionClient,
  p: SetStockParams
): Promise<{ prevQty: number; prevRate: number; actualQty: number } | null> {
  if (p.qty < 0) throw new Error("Reconciled quantity can't be negative");
  const bin = await tx.bin.findUnique({
    where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } },
  });
  const prevQty = bin?.actualQty ?? 0;
  const prevRate = bin ? Number(bin.valuationRate) : 0;
  const prevValue = bin ? Number(bin.stockValue) : 0;

  const newRate = round6(p.rate != null ? p.rate : prevRate);
  const qtyAfter = round6(p.qty);
  const newValue = round2(qtyAfter * newRate);
  const actualQty = round6(qtyAfter - prevQty);
  const valueDiff = round2(newValue - prevValue);

  if (actualQty === 0 && valueDiff === 0) return null;

  await tx.stockLedgerEntry.create({
    data: {
      itemId: p.itemId, warehouseId: p.warehouseId, postingAt: p.postingAt,
      voucherType: p.voucherType, voucherNo: p.voucherNo, voucherDetailId: p.voucherDetailId ?? null,
      actualQty, qtyAfterTransaction: qtyAfter, incomingRate: actualQty > 0 ? newRate : 0,
      valuationRate: newRate, stockValue: newValue, stockValueDifference: valueDiff, createdBy: p.createdBy ?? null,
    },
  });

  const ordered = bin?.orderedQty ?? 0;
  const planned = bin?.plannedQty ?? 0;
  const reserved = bin?.reservedQty ?? 0;
  await tx.bin.upsert({
    where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } },
    update: { actualQty: qtyAfter, valuationRate: newRate, stockValue: newValue, projectedQty: round6(qtyAfter + ordered + planned - reserved) },
    create: { itemId: p.itemId, warehouseId: p.warehouseId, actualQty: qtyAfter, valuationRate: newRate, stockValue: newValue, projectedQty: qtyAfter },
  });

  return { prevQty, prevRate, actualQty };
}
