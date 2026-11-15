"use server";

import { prisma } from "@/lib/prisma";

export async function getStockLedger(filter?: { itemId?: string; warehouseId?: string }) {
  const rows = await prisma.stockLedgerEntry.findMany({
    where: {
      itemId: filter?.itemId || undefined,
      warehouseId: filter?.warehouseId || undefined,
    },
    include: {
      item: { select: { itemCode: true, itemName: true } },
      warehouse: { select: { warehouseName: true } },
    },
    orderBy: [{ postingAt: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  // Resolve each voucher (type + name) to the document's URL so the ledger
  // can link straight to its source. Batched per type to avoid N queries.
  const namesByType = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!namesByType.has(r.voucherType)) namesByType.set(r.voucherType, new Set());
    namesByType.get(r.voucherType)!.add(r.voucherNo);
  }
  const names = (t: string) => Array.from(namesByType.get(t) ?? []);
  const href = new Map<string, string>();
  const [ses, prs, dns, srs] = await Promise.all([
    names("Stock Entry").length
      ? prisma.stockEntry.findMany({ where: { name: { in: names("Stock Entry") } }, select: { id: true, name: true } })
      : [],
    names("Purchase Receipt").length
      ? prisma.purchaseReceipt.findMany({ where: { name: { in: names("Purchase Receipt") } }, select: { id: true, name: true } })
      : [],
    names("Delivery Note").length
      ? prisma.deliveryNote.findMany({ where: { name: { in: names("Delivery Note") } }, select: { id: true, name: true } })
      : [],
    names("Stock Reconciliation").length
      ? prisma.stockReconciliation.findMany({ where: { name: { in: names("Stock Reconciliation") } }, select: { id: true, name: true } })
      : [],
  ]);
  ses.forEach((d) => href.set(`Stock Entry|${d.name}`, `/stock/stock-entry/${d.id}`));
  prs.forEach((d) => href.set(`Purchase Receipt|${d.name}`, `/buying/purchase-receipt/${d.id}`));
  dns.forEach((d) => href.set(`Delivery Note|${d.name}`, `/selling/delivery-note/${d.id}`));
  srs.forEach((d) => href.set(`Stock Reconciliation|${d.name}`, `/stock/reconciliation/${d.id}`));

  return rows.map((r) => ({
    id: r.id,
    postingAt: r.postingAt.toISOString(),
    itemId: r.itemId,
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    warehouseId: r.warehouseId,
    warehouse: r.warehouse.warehouseName,
    voucherType: r.voucherType,
    voucherNo: r.voucherNo,
    voucherHref: href.get(`${r.voucherType}|${r.voucherNo}`) ?? null,
    actualQty: r.actualQty,
    qtyAfterTransaction: r.qtyAfterTransaction,
    valuationRate: Number(r.valuationRate),
    stockValue: Number(r.stockValue),
    isCancelled: r.isCancelled,
  }));
}

export async function getStockBalance() {
  const rows = await prisma.bin.findMany({
    include: {
      item: { select: { itemCode: true, itemName: true, stockUom: true } },
      warehouse: { select: { warehouseName: true } },
    },
    orderBy: [{ item: { itemCode: "asc" } }, { warehouse: { warehouseName: "asc" } }],
  });
  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    uom: r.item.stockUom,
    warehouseId: r.warehouseId,
    warehouse: r.warehouse.warehouseName,
    actualQty: r.actualQty,
    reservedQty: r.reservedQty,
    orderedQty: r.orderedQty,
    projectedQty: r.projectedQty,
    valuationRate: Number(r.valuationRate),
    stockValue: Number(r.stockValue),
  }));
}
