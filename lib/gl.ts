import { Prisma } from "@prisma/client";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type GlLine = { accountId: string; debit?: number; credit?: number };

// Post a balanced set of GL entries (double-entry). Immutable, like the stock ledger.
export async function postGL(
  tx: Prisma.TransactionClient,
  p: { lines: GlLine[]; voucherType: string; voucherNo: string; postingAt: Date; againstParty?: string | null; remarks?: string | null }
) {
  const totalDr = round2(p.lines.reduce((s, l) => s + (l.debit ?? 0), 0));
  const totalCr = round2(p.lines.reduce((s, l) => s + (l.credit ?? 0), 0));
  if (totalDr !== totalCr) throw new Error(`Unbalanced entry: debit ${totalDr} ≠ credit ${totalCr}`);
  for (const l of p.lines) {
    const debit = round2(l.debit ?? 0), credit = round2(l.credit ?? 0);
    if (debit === 0 && credit === 0) continue;
    await tx.gLEntry.create({
      data: { accountId: l.accountId, debit, credit, voucherType: p.voucherType, voucherNo: p.voucherNo, postingAt: p.postingAt, againstParty: p.againstParty ?? null, remarks: p.remarks ?? null },
    });
  }
}

// Resolve a required account by name (from the standard chart).
export async function getAccountId(tx: Prisma.TransactionClient, accountName: string): Promise<string> {
  const a = await tx.account.findUnique({ where: { accountName } });
  if (!a) throw new Error(`Account "${accountName}" not found — create the standard chart of accounts first`);
  return a.id;
}

// Reverse a voucher's GL entries (post the opposite) and mark the originals cancelled.
export async function reverseGL(tx: Prisma.TransactionClient, voucherType: string, voucherNo: string, postingAt: Date) {
  const entries = await tx.gLEntry.findMany({ where: { voucherType, voucherNo, isCancelled: false } });
  for (const e of entries) {
    await tx.gLEntry.create({
      data: { accountId: e.accountId, debit: e.credit, credit: e.debit, voucherType, voucherNo, postingAt, againstParty: e.againstParty, remarks: "Cancelled" },
    });
  }
  await tx.gLEntry.updateMany({ where: { voucherType, voucherNo, isCancelled: false }, data: { isCancelled: true } });
}
