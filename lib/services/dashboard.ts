import { prisma } from "@/lib/prisma";
import type { DashboardData } from "@/features/dashboard/schema";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function getDashboard(): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  // First day of the month, 5 months back → a 6-month trailing window.
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    binAgg,
    itemCount,
    warehouseCount,
    openSO,
    openPO,
    openWO,
    recvAgg,
    payAgg,
    monthSalesAgg,
    monthPurchasesAgg,
    overdue,
    cashAccounts,
    recentMovements,
    recentGL,
    openSalesOrders,
    bins,
    items,
    salesTrend,
    purchaseTrend,
  ] = await Promise.all([
    prisma.bin.aggregate({ _sum: { stockValue: true } }),
    prisma.item.count({ where: { disabled: false } }),
    prisma.warehouse.count({ where: { disabled: false } }),
    prisma.salesOrder.count({ where: { status: "TO_FULFILL" } }),
    prisma.purchaseOrder.count({ where: { status: "TO_FULFILL" } }),
    prisma.workOrder.count({
      where: { status: { in: ["NOT_STARTED", "IN_PROCESS"] } },
    }),
    prisma.salesInvoice.aggregate({
      _sum: { outstanding: true },
      where: { status: "SUBMITTED" },
    }),
    prisma.purchaseInvoice.aggregate({
      _sum: { outstanding: true },
      where: { status: "SUBMITTED" },
    }),
    prisma.salesInvoice.aggregate({
      _sum: { total: true },
      where: { status: "SUBMITTED", postingAt: { gte: monthStart } },
    }),
    prisma.purchaseInvoice.aggregate({
      _sum: { total: true },
      where: { status: "SUBMITTED", postingAt: { gte: monthStart } },
    }),
    prisma.salesInvoice.aggregate({
      _sum: { outstanding: true },
      _count: true,
      where: {
        status: "SUBMITTED",
        outstanding: { gt: 0 },
        dueDate: { lt: now },
      },
    }),
    prisma.account.findMany({
      where: { accountType: { in: ["Cash", "Bank"] } },
      select: { id: true },
    }),
    prisma.stockLedgerEntry.findMany({
      where: { isCancelled: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        item: { select: { itemCode: true } },
        warehouse: { select: { warehouseName: true } },
      },
    }),
    prisma.gLEntry.findMany({
      where: { isCancelled: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { account: { select: { accountName: true } } },
    }),
    prisma.salesOrder.findMany({
      where: { status: "TO_FULFILL" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { customerName: true } } },
    }),
    prisma.bin.findMany({
      include: {
        warehouse: { select: { warehouseName: true } },
        item: { select: { itemCode: true, itemName: true, reorderLevel: true } },
      },
    }),
    prisma.item.findMany({
      where: { disabled: false, reorderLevel: { gt: 0 } },
      select: { id: true, itemCode: true, itemName: true, reorderLevel: true },
    }),
    prisma.salesInvoice.findMany({
      where: { status: "SUBMITTED", postingAt: { gte: trendStart } },
      select: { postingAt: true, total: true },
    }),
    prisma.purchaseInvoice.findMany({
      where: { status: "SUBMITTED", postingAt: { gte: trendStart } },
      select: { postingAt: true, total: true },
    }),
  ]);

  // Cash + bank balance from the GL (debit - credit on cash/bank accounts),
  // plus the full ledger so we can build a running end-of-month trend.
  let cashBalance = 0;
  let cashLedger: { postingAt: Date; debit: number; credit: number }[] = [];
  if (cashAccounts.length) {
    const ids = cashAccounts.map((a) => a.id);
    const entries = await prisma.gLEntry.findMany({
      where: { isCancelled: false, accountId: { in: ids } },
      select: { postingAt: true, debit: true, credit: true },
    });
    cashLedger = entries.map((e) => ({
      postingAt: e.postingAt,
      debit: Number(e.debit),
      credit: Number(e.credit),
    }));
    cashBalance = cashLedger.reduce((s, e) => s + (e.debit - e.credit), 0);
  }

  // Stock value by warehouse.
  const byWh = new Map<string, number>();
  for (const b of bins) {
    byWh.set(
      b.warehouse.warehouseName,
      (byWh.get(b.warehouse.warehouseName) ?? 0) + Number(b.stockValue),
    );
  }
  const stockByWarehouse = Array.from(byWh.entries())
    .map(([warehouse, value]) => ({ warehouse, value: round2(value) }))
    .sort((a, b) => b.value - a.value);

  // Top items by stock value (aggregate bins per item).
  const byItem = new Map<
    string,
    { itemCode: string; itemName: string; qty: number; value: number }
  >();
  for (const b of bins) {
    const cur = byItem.get(b.itemId) ?? {
      itemCode: b.item.itemCode,
      itemName: b.item.itemName,
      qty: 0,
      value: 0,
    };
    cur.qty += b.actualQty;
    cur.value += Number(b.stockValue);
    byItem.set(b.itemId, cur);
  }
  const topItems = Array.from(byItem.entries())
    .map(([itemId, v]) => ({ itemId, ...v, value: round2(v.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Low-stock items: on-hand (sum of bin actualQty) below the reorder level.
  const qtyByItem = new Map<string, number>();
  for (const b of bins)
    qtyByItem.set(b.itemId, (qtyByItem.get(b.itemId) ?? 0) + b.actualQty);
  const lowStockItems = items
    .map((it) => ({
      itemId: it.id,
      itemCode: it.itemCode,
      itemName: it.itemName,
      qty: round2(qtyByItem.get(it.id) ?? 0),
      reorderLevel: it.reorderLevel,
    }))
    .filter((it) => it.qty < it.reorderLevel)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 6);

  // 6-month trailing sales vs purchases, bucketed by calendar month.
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const trendBuckets = new Map<
    string,
    { month: string; sales: number; purchases: number }
  >();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendBuckets.set(monthKey(d), {
      month: d.toLocaleString("en-US", { month: "short" }),
      sales: 0,
      purchases: 0,
    });
  }
  for (const s of salesTrend) {
    const b = trendBuckets.get(monthKey(s.postingAt));
    if (b) b.sales += Number(s.total);
  }
  for (const p of purchaseTrend) {
    const b = trendBuckets.get(monthKey(p.postingAt));
    if (b) b.purchases += Number(p.total);
  }
  const monthlyTrend = Array.from(trendBuckets.values()).map((b) => ({
    month: b.month,
    sales: round2(b.sales),
    purchases: round2(b.purchases),
  }));

  // Running cash + bank balance at each month-end across the same window.
  let cashOpening = 0;
  const cashMonthNet = new Map<string, number>();
  for (const e of cashLedger) {
    const net = e.debit - e.credit;
    const k = monthKey(e.postingAt);
    if (trendBuckets.has(k)) {
      cashMonthNet.set(k, (cashMonthNet.get(k) ?? 0) + net);
    } else if (e.postingAt < trendStart) {
      cashOpening += net; // everything before the window forms the opening
    }
  }
  let cashRunning = cashOpening;
  const cashTrend = Array.from(trendBuckets.entries()).map(([key, b]) => {
    cashRunning += cashMonthNet.get(key) ?? 0;
    return { month: b.month, balance: round2(cashRunning) };
  });

  return {
    kpis: {
      stockValue: Number(binAgg._sum.stockValue ?? 0),
      receivables: Number(recvAgg._sum.outstanding ?? 0),
      payables: Number(payAgg._sum.outstanding ?? 0),
      cashBalance: round2(cashBalance),
      monthSales: Number(monthSalesAgg._sum.total ?? 0),
      monthPurchases: Number(monthPurchasesAgg._sum.total ?? 0),
      overdueCount: overdue._count,
      overdueAmount: Number(overdue._sum.outstanding ?? 0),
    },
    counts: {
      itemCount,
      warehouseCount,
      openSO,
      openPO,
      openWO,
      lowStockCount: lowStockItems.length,
    },
    monthlyTrend,
    cashTrend,
    stockByWarehouse,
    topItems,
    openSalesOrders: openSalesOrders.map((o) => ({
      id: o.id,
      name: o.name,
      customer: o.customer.customerName,
      totalAmount: Number(o.totalAmount),
    })),
    recentMovements: recentMovements.map((m) => ({
      id: m.id,
      itemId: m.itemId,
      itemCode: m.item.itemCode,
      warehouse: m.warehouse.warehouseName,
      actualQty: m.actualQty,
      voucherType: m.voucherType,
      voucherNo: m.voucherNo,
    })),
    recentGL: recentGL.map((g) => ({
      id: g.id,
      account: g.account.accountName,
      voucherNo: g.voucherNo,
      debit: Number(g.debit),
      credit: Number(g.credit),
    })),
    lowStockItems,
  };
}
