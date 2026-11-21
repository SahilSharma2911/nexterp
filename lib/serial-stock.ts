import type { Prisma } from "@prisma/client";

// Split a pasted serials blob (one per line, or comma/semicolon separated) into
// clean, de-duplicated serial numbers.
export function parseSerials(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const s = part.trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

// Register serial numbers received into stock (status IN_STOCK). Validates the
// count against the received qty and rejects serials that already exist.
export async function receiveSerials(
  tx: Prisma.TransactionClient,
  p: {
    itemId: string;
    warehouseId: string | null;
    qty: number;
    serials: string[];
  },
): Promise<void> {
  if (p.serials.length === 0) return; // capture is optional
  if (p.serials.length !== Math.round(p.qty))
    throw new Error(
      `Enter exactly ${Math.round(p.qty)} serial number(s) — got ${p.serials.length}.`,
    );
  const dupes = await tx.serialNo.findMany({
    where: { itemId: p.itemId, serialNo: { in: p.serials } },
    select: { serialNo: true },
  });
  if (dupes.length)
    throw new Error(
      `Serial(s) already exist for this item: ${dupes.map((d) => d.serialNo).join(", ")}`,
    );
  await tx.serialNo.createMany({
    data: p.serials.map((serialNo) => ({
      itemId: p.itemId,
      serialNo,
      warehouseId: p.warehouseId,
      status: "IN_STOCK" as const,
    })),
  });
}

// Consume serials on issue: auto-pick the oldest IN_STOCK units for the item
// (preferring the issuing warehouse) and flip them to DELIVERED, stamping the
// voucher so a cancel can restore them. Lenient — marks up to `qty`.
export async function consumeSerials(
  tx: Prisma.TransactionClient,
  p: {
    itemId: string;
    warehouseId: string;
    qty: number;
    voucherType: string;
    voucherNo: string;
  },
): Promise<number> {
  const n = Math.round(p.qty);
  if (n <= 0) return 0;
  const picked = await tx.serialNo.findMany({
    where: {
      itemId: p.itemId,
      status: "IN_STOCK",
      OR: [{ warehouseId: p.warehouseId }, { warehouseId: null }],
    },
    orderBy: { createdAt: "asc" },
    take: n,
    select: { id: true },
  });
  if (picked.length === 0) return 0;
  await tx.serialNo.updateMany({
    where: { id: { in: picked.map((s) => s.id) } },
    data: {
      status: "DELIVERED",
      outVoucherType: p.voucherType,
      outVoucherNo: p.voucherNo,
    },
  });
  return picked.length;
}

// Remove serials that a receipt created (on cancel of that receipt). Only
// deletes units still IN_STOCK — ones already issued are left alone.
export async function removeReceivedSerials(
  tx: Prisma.TransactionClient,
  p: { itemId: string; serials: string[] },
): Promise<void> {
  if (p.serials.length === 0) return;
  await tx.serialNo.deleteMany({
    where: { itemId: p.itemId, serialNo: { in: p.serials }, status: "IN_STOCK" },
  });
}

// Restore serials delivered by a voucher back to IN_STOCK (on cancel).
export async function restoreSerials(
  tx: Prisma.TransactionClient,
  p: { voucherType: string; voucherNo: string },
): Promise<void> {
  await tx.serialNo.updateMany({
    where: { outVoucherType: p.voucherType, outVoucherNo: p.voucherNo },
    data: { status: "IN_STOCK", outVoucherType: null, outVoucherNo: null },
  });
}
