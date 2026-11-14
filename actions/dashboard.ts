"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboard() {
  const [
    binAgg, itemCount, warehouseCount,
    openSO, openPO, openWO,
    recvAgg, payAgg,
    cashAccounts,
    recentMovements, recentGL, openSalesOrders, bins,
  ] = await Promise.all([
    prisma.bin.aggregate({ _sum: { stockValue: true } }),
    prisma.item.count({ where: { disabled: false } }),
    prisma.warehouse.count({ where: { disabled: false } }),
    prisma.salesOrder.count({ where: { status: "TO_FULFILL" } }),
    prisma.purchaseOrder.count({ where: { status: "TO_FULFILL" } }),
    prisma.workOrder.count({ where: { status: { in: ["NOT_STARTED", "IN_PROCESS"] } } }),
    prisma.salesInvoice.aggregate({ _sum: { outstanding: true }, where: { status: "SUBMITTED" } }),
    prisma.purchaseInvoice.aggregate({ _sum: { outstanding: true }, where: { status: "SUBMITTED" } }),
    prisma.account.findMany({ where: { accountType: { in: ["Cash", "Bank"] } }, select: { id: true } }),
    prisma.stockLedgerEntry.findMany({ where: { isCancelled: false }, orderBy: { createdAt: "desc" }, take: 6, include: { item: { select: { itemCode: true } }, warehouse: { select: { warehouseName: true } } } }),
    prisma.gLEntry.findMany({ where: { isCancelled: false }, orderBy: { createdAt: "desc" }, take: 6, include: { account: { select: { accountName: true } } } }),
    prisma.salesOrder.findMany({ where: { status: "TO_FULFILL" }, orderBy: { createdAt: "desc" }, take: 6, include: { customer: { select: { customerName: true } } } }),
    prisma.bin.findMany({ include: { warehouse: { select: { warehouseName: true } } } }),
  ]);

  // Cash + bank balance from the GL (debit - credit on cash/bank accounts).
  let cashBalance = 0;
  if (cashAccounts.length) {
    const g = await prisma.gLEntry.groupBy({ by: ["accountId"], where: { isCancelled: false, accountId: { in: cashAccounts.map((a) => a.id) } }, _sum: { debit: true, credit: true } });
    cashBalance = g.reduce((s, x) => s + (Number(x._sum.debit ?? 0) - Number(x._sum.credit ?? 0)), 0);
  }

  // Stock value by warehouse.
  const byWh = new Map<string, number>();
  for (const b of bins) byWh.set(b.warehouse.warehouseName, (byWh.get(b.warehouse.warehouseName) ?? 0) + Number(b.stockValue));
  const stockByWarehouse = Array.from(byWh.entries()).map(([warehouse, value]) => ({ warehouse, value })).sort((a, b) => b.value - a.value);

  return {
    stockValue: Number(binAgg._sum.stockValue ?? 0),
    itemCount, warehouseCount, openSO, openPO, openWO,
    receivables: Number(recvAgg._sum.outstanding ?? 0),
    payables: Number(payAgg._sum.outstanding ?? 0),
    cashBalance: Math.round(cashBalance * 100) / 100,
    stockByWarehouse,
    recentMovements: recentMovements.map((m) => ({ id: m.id, itemCode: m.item.itemCode, warehouse: m.warehouse.warehouseName, actualQty: m.actualQty, voucherType: m.voucherType, voucherNo: m.voucherNo })),
    recentGL: recentGL.map((g) => ({ id: g.id, account: g.account.accountName, voucherNo: g.voucherNo, debit: Number(g.debit), credit: Number(g.credit) })),
    openSalesOrders: openSalesOrders.map((o) => ({ id: o.id, name: o.name, customer: o.customer.customerName, totalAmount: Number(o.totalAmount) })),
  };
}
