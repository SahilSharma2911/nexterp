import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";

const round6 = (n: number) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;
const EPS = 1e-9;

type Db = Prisma.TransactionClient | typeof prisma;

// Live on-hand per batch for an item, derived from the stock ledger
// (receipts − issues). Optionally scoped to a warehouse. Never stored — always
// computed, so it can't drift from the ledger.
export async function batchOnHand(
  itemId: string,
  warehouseId?: string,
  db: Db = prisma,
): Promise<Map<string, number>> {
  const where: Prisma.StockLedgerEntryWhereInput = {
    itemId,
    isCancelled: false,
    batchId: { not: null },
  };
  if (warehouseId) where.warehouseId = warehouseId;
  const rows = await db.stockLedgerEntry.groupBy({
    by: ["batchId"],
    where,
    _sum: { actualQty: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.batchId) map.set(r.batchId, round6(r._sum.actualQty ?? 0));
  }
  return map;
}

export type FefoAllocation = { batchId: string; batchNo: string; qty: number };

// First-Expiry-First-Out allocation: spread `qty` across the item's batches in
// a warehouse, consuming the nearest-expiry lots first (undated lots last).
// Returns the per-batch split and any shortfall the batches couldn't cover.
export async function allocateFefo(
  tx: Prisma.TransactionClient,
  itemId: string,
  warehouseId: string,
  qty: number,
): Promise<{ alloc: FefoAllocation[]; shortfall: number }> {
  const onHand = await batchOnHand(itemId, warehouseId, tx);
  const ids = [...onHand.keys()].filter((id) => (onHand.get(id) ?? 0) > EPS);
  if (ids.length === 0) return { alloc: [], shortfall: round6(qty) };

  // Nearest expiry first; Postgres orders NULLs last for ASC, so undated lots
  // are consumed only after dated ones.
  const batches = await tx.batch.findMany({
    where: { id: { in: ids } },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, batchNo: true },
  });

  let remaining = qty;
  const alloc: FefoAllocation[] = [];
  for (const b of batches) {
    if (remaining <= EPS) break;
    const available = onHand.get(b.id) ?? 0;
    if (available <= EPS) continue;
    const take = Math.min(available, remaining);
    alloc.push({ batchId: b.id, batchNo: b.batchNo, qty: round6(take) });
    remaining = round6(remaining - take);
  }
  return { alloc, shortfall: Math.max(0, round6(remaining)) };
}

// Find-or-create a lot for an item (used by receipt flows that capture a batch
// number). On-hand is ledger-derived, so the row is created with qty 0 — the
// receipt SLE that follows supplies the actual quantity.
export async function ensureBatch(
  tx: Prisma.TransactionClient,
  p: {
    itemId: string;
    batchNo: string;
    warehouseId?: string | null;
    expiryDate?: Date | null;
  },
): Promise<string> {
  const batchNo = p.batchNo.trim();
  const existing = await tx.batch.findUnique({
    where: { itemId_batchNo: { itemId: p.itemId, batchNo } },
  });
  if (existing) {
    // Backfill expiry/warehouse if this receipt supplies them and the lot
    // didn't have them yet.
    if ((p.expiryDate && !existing.expiryDate) || (p.warehouseId && !existing.warehouseId)) {
      await tx.batch.update({
        where: { id: existing.id },
        data: {
          expiryDate: existing.expiryDate ?? p.expiryDate ?? null,
          warehouseId: existing.warehouseId ?? p.warehouseId ?? null,
        },
      });
    }
    return existing.id;
  }
  const created = await tx.batch.create({
    data: {
      itemId: p.itemId,
      batchNo,
      warehouseId: p.warehouseId ?? null,
      expiryDate: p.expiryDate ?? null,
      qty: 0,
    },
  });
  return created.id;
}

type IssueParams = {
  itemId: string;
  warehouseId: string;
  qty: number; // positive quantity to issue out
  voucherType: string;
  voucherNo: string;
  voucherDetailId?: string | null;
  postingAt: Date;
  createdBy?: string | null;
};

// Issue stock out, FEFO-splitting across batches for batch-tracked items. Any
// quantity the batches can't cover falls back to a plain (unbatched) issue, so
// the full amount always leaves stock. Returns the summed value + the latest
// valuation rate (valuation is item-level, so the rate is consistent). Reused
// by every issue flow (job cards, stock entry, delivery note, …).
export async function postIssueFefo(
  tx: Prisma.TransactionClient,
  p: IssueParams,
  batchTracked: boolean,
): Promise<{ valueDiff: number; valuationRate: number; alloc: FefoAllocation[] }> {
  const { qty, ...base } = p;
  let remaining = qty;
  let valueDiff = 0;
  let valuationRate = 0;
  let alloc: FefoAllocation[] = [];

  if (batchTracked) {
    const r = await allocateFefo(tx, p.itemId, p.warehouseId, qty);
    alloc = r.alloc;
    for (const a of alloc) {
      const res = await postStockLedger(tx, {
        ...base,
        actualQty: -a.qty,
        batchId: a.batchId,
      });
      valueDiff += res.stockValueDifference;
      valuationRate = res.valuationRate;
    }
    remaining = r.shortfall;
  }

  if (remaining > EPS) {
    const res = await postStockLedger(tx, { ...base, actualQty: -remaining });
    valueDiff += res.stockValueDifference;
    valuationRate = res.valuationRate;
  }

  return { valueDiff, valuationRate, alloc };
}
