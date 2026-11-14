import { Prisma } from "@prisma/client";

const round6 = (n: number) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;

// Adjust a bin's planning quantities (ordered from POs, reserved for SOs) and
// recompute projected = actual + ordered + planned - reserved. Does not touch
// actual stock (that only moves via the ledger).
export async function adjustBinReservation(
  tx: Prisma.TransactionClient,
  p: { itemId: string; warehouseId: string; orderedDelta?: number; reservedDelta?: number }
) {
  const bin = await tx.bin.findUnique({ where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } } });
  const actual = bin?.actualQty ?? 0;
  const planned = bin?.plannedQty ?? 0;
  const ordered = Math.max(0, round6((bin?.orderedQty ?? 0) + (p.orderedDelta ?? 0)));
  const reserved = Math.max(0, round6((bin?.reservedQty ?? 0) + (p.reservedDelta ?? 0)));
  const projected = round6(actual + ordered + planned - reserved);

  await tx.bin.upsert({
    where: { itemId_warehouseId: { itemId: p.itemId, warehouseId: p.warehouseId } },
    update: { orderedQty: ordered, reservedQty: reserved, projectedQty: projected },
    create: { itemId: p.itemId, warehouseId: p.warehouseId, orderedQty: ordered, reservedQty: reserved, projectedQty: projected },
  });
}
