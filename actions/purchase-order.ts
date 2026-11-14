"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { adjustBinReservation } from "@/lib/bin";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type PoItemInput = { itemId: string; qty: number; rate: number };
export type PoInput = { supplierId: string; warehouseId: string; requiredBy?: string | null; remarks?: string; items: PoItemInput[] };

export async function createPurchaseOrder(input: PoInput) {
  if (!input.supplierId) throw new Error("Select a supplier");
  if (!input.warehouseId) throw new Error("Select a warehouse");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) { if (!it.itemId) throw new Error("Every row needs an item"); if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive"); }
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  const name = `PO-${year}-${String(count + 1).padStart(5, "0")}`;
  let totalQty = 0, totalAmount = 0;
  const rows = input.items.map((it) => { const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate); totalQty += qty; totalAmount += amount; return { itemId: it.itemId, qty, rate, amount }; });
  const row = await prisma.purchaseOrder.create({
    data: { name, supplierId: input.supplierId, warehouseId: input.warehouseId, requiredBy: input.requiredBy ? new Date(input.requiredBy) : null, remarks: input.remarks?.trim() || null, totalQty, totalAmount: round2(totalAmount), items: { create: rows } },
  });
  revalidatePath("/buying/purchase-order");
  return { ok: true, id: row.id, name };
}

export async function submitPurchaseOrder(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!po) throw new Error("Purchase Order not found");
    if (po.status !== "DRAFT") throw new Error("Only draft orders can be submitted");
    for (const it of po.items) await adjustBinReservation(tx, { itemId: it.itemId, warehouseId: po.warehouseId, orderedDelta: it.qty });
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "TO_FULFILL", submittedAt: new Date() } });
  });
  revalidatePath("/buying/purchase-order");
  revalidatePath(`/buying/purchase-order/${input.id}`);
  revalidatePath("/stock/balance");
  return { ok: true };
}

export async function cancelPurchaseOrder(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!po) throw new Error("Purchase Order not found");
    if (po.status === "DRAFT") { await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "CANCELLED", cancelledAt: new Date() } }); return; }
    if (po.status !== "TO_FULFILL") throw new Error("This order can't be cancelled");
    if (po.items.some((i) => i.receivedQty > 0)) throw new Error("Goods already received against this order — cancel the receipts first");
    for (const it of po.items) await adjustBinReservation(tx, { itemId: it.itemId, warehouseId: po.warehouseId, orderedDelta: -(it.qty - it.receivedQty) });
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/buying/purchase-order");
  revalidatePath(`/buying/purchase-order/${input.id}`);
  revalidatePath("/stock/balance");
  return { ok: true };
}

/* ---- getters ---- */
export async function getPurchaseOrders() {
  const rows = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: { select: { supplierName: true } }, _count: { select: { items: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, supplier: r.supplier.supplierName, status: r.status, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), itemCount: r._count.items }));
}
export async function getPurchaseOrder(id: string) {
  const r = await prisma.purchaseOrder.findUnique({ where: { id }, include: { supplier: { select: { supplierName: true } }, warehouse: { select: { warehouseName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, supplier: r.supplier.supplierName, warehouse: r.warehouse.warehouseName, status: r.status, remarks: r.remarks, totalQty: r.totalQty, totalAmount: Number(r.totalAmount),
    items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount), receivedQty: it.receivedQty })) };
}

// Prefill data for "Create Purchase Receipt" against this PO (remaining qty).
export async function getPoPrefill(id: string) {
  const r = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { item: { select: { id: true, itemCode: true, itemName: true, valuationRate: true } } } } } });
  if (!r || r.status !== "TO_FULFILL") return null;
  return { id: r.id, name: r.name, supplierId: r.supplierId, warehouseId: r.warehouseId,
    items: r.items.map((it) => ({ itemId: it.itemId, itemCode: it.item.itemCode, itemName: it.item.itemName, remaining: Math.max(0, Math.round((it.qty - it.receivedQty) * 1e6) / 1e6), rate: Number(it.rate) })).filter((x) => x.remaining > 0) };
}
