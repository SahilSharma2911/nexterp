"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postStockLedger } from "@/lib/stock-ledger";

const VT = "Purchase Receipt";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type PrItemInput = { itemId: string; qty: number; rate: number };
export type PrInput = { supplierId: string; warehouseId: string; remarks?: string; items: PrItemInput[] };

export async function createPurchaseReceipt(input: PrInput) {
  if (!input.supplierId) throw new Error("Select a supplier");
  if (!input.warehouseId) throw new Error("Select a warehouse to receive into");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
  const year = new Date().getFullYear();
  const count = await prisma.purchaseReceipt.count();
  const name = `PR-${year}-${String(count + 1).padStart(5, "0")}`;
  let totalQty = 0, totalAmount = 0;
  const rows = input.items.map((it) => {
    const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate);
    totalQty += qty; totalAmount += amount;
    return { itemId: it.itemId, qty, rate, amount };
  });
  const row = await prisma.purchaseReceipt.create({
    data: { name, supplierId: input.supplierId, warehouseId: input.warehouseId, remarks: input.remarks?.trim() || null, totalQty, totalAmount: round2(totalAmount), items: { create: rows } },
  });
  revalidatePath("/buying/purchase-receipt");
  return { ok: true, id: row.id, name };
}

export async function submitPurchaseReceipt(input: { id: string }) {
  const pr = await prisma.purchaseReceipt.findUnique({ where: { id: input.id }, include: { items: true } });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "DRAFT") throw new Error("Only draft receipts can be submitted");
  await prisma.$transaction(async (tx) => {
    for (const it of pr.items) {
      await postStockLedger(tx, { itemId: it.itemId, warehouseId: pr.warehouseId, actualQty: it.qty, incomingRate: Number(it.rate), voucherType: VT, voucherNo: pr.name, voucherDetailId: it.id, postingAt: pr.postingAt });
    }
    await tx.purchaseReceipt.update({ where: { id: pr.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
  });
  revalidatePath("/buying/purchase-receipt");
  revalidatePath(`/buying/purchase-receipt/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

export async function cancelPurchaseReceipt(input: { id: string }) {
  const pr = await prisma.purchaseReceipt.findUnique({ where: { id: input.id } });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "SUBMITTED") throw new Error("Only submitted receipts can be cancelled");
  await prisma.$transaction(async (tx) => {
    const sles = await tx.stockLedgerEntry.findMany({ where: { voucherType: VT, voucherNo: pr.name, isCancelled: false } });
    for (const s of sles) {
      await postStockLedger(tx, { itemId: s.itemId, warehouseId: s.warehouseId, actualQty: -s.actualQty, incomingRate: Number(s.valuationRate), voucherType: VT, voucherNo: pr.name, voucherDetailId: s.voucherDetailId, postingAt: new Date() });
    }
    await tx.stockLedgerEntry.updateMany({ where: { voucherType: VT, voucherNo: pr.name, isCancelled: false }, data: { isCancelled: true } });
    await tx.purchaseReceipt.update({ where: { id: pr.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/buying/purchase-receipt");
  revalidatePath(`/buying/purchase-receipt/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

/* ---- getters ---- */
export async function getPurchaseReceipts() {
  const rows = await prisma.purchaseReceipt.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: { select: { supplierName: true } }, warehouse: { select: { warehouseName: true } }, _count: { select: { items: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, supplier: r.supplier.supplierName, warehouse: r.warehouse.warehouseName, status: r.status, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), itemCount: r._count.items, postingAt: r.postingAt.toISOString() }));
}
export async function getPurchaseReceipt(id: string) {
  const r = await prisma.purchaseReceipt.findUnique({ where: { id }, include: { supplier: { select: { supplierName: true } }, warehouse: { select: { warehouseName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true, stockUom: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, supplier: r.supplier.supplierName, warehouse: r.warehouse.warehouseName, status: r.status, postingAt: r.postingAt.toISOString(), remarks: r.remarks, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, uom: it.uom, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount) })) };
}
