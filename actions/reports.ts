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
  return rows.map((r) => ({
    id: r.id,
    postingAt: r.postingAt.toISOString(),
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    warehouse: r.warehouse.warehouseName,
    voucherType: r.voucherType,
    voucherNo: r.voucherNo,
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
    itemCode: r.item.itemCode,
    itemName: r.item.itemName,
    uom: r.item.stockUom,
    warehouse: r.warehouse.warehouseName,
    actualQty: r.actualQty,
    reservedQty: r.reservedQty,
    orderedQty: r.orderedQty,
    projectedQty: r.projectedQty,
    valuationRate: Number(r.valuationRate),
    stockValue: Number(r.stockValue),
  }));
}
