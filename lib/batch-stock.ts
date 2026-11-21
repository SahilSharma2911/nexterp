import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
