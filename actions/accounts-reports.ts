"use server";

import { prisma } from "@/lib/prisma";

export async function getGeneralLedger() {
  const rows = await prisma.gLEntry.findMany({
    orderBy: [{ postingAt: "desc" }, { createdAt: "desc" }],
    include: { account: { select: { accountName: true } } },
    take: 500,
  });
  return rows.map((r) => ({
    id: r.id, postingAt: r.postingAt.toISOString(), account: r.account.accountName,
    voucherType: r.voucherType, voucherNo: r.voucherNo, against: r.againstParty,
    debit: Number(r.debit), credit: Number(r.credit), isCancelled: r.isCancelled,
  }));
}

export async function getTrialBalance() {
  const accounts = await prisma.account.findMany({ orderBy: [{ rootType: "asc" }, { accountName: "asc" }] });
  const grouped = await prisma.gLEntry.groupBy({
    by: ["accountId"],
    where: { isCancelled: false },
    _sum: { debit: true, credit: true },
  });
  const byAcc = new Map(grouped.map((g) => [g.accountId, { debit: Number(g._sum.debit ?? 0), credit: Number(g._sum.credit ?? 0) }]));
  const rows = accounts.map((a) => {
    const s = byAcc.get(a.id) ?? { debit: 0, credit: 0 };
    const net = Math.round((s.debit - s.credit) * 100) / 100;
    return { id: a.id, accountName: a.accountName, rootType: a.rootType, debit: s.debit, credit: s.credit, balanceDebit: net > 0 ? net : 0, balanceCredit: net < 0 ? -net : 0 };
  }).filter((r) => r.debit !== 0 || r.credit !== 0);
  const totalDr = Math.round(rows.reduce((s, r) => s + r.balanceDebit, 0) * 100) / 100;
  const totalCr = Math.round(rows.reduce((s, r) => s + r.balanceCredit, 0) * 100) / 100;
  return { rows, totalDr, totalCr };
}
