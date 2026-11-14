"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { adjustBinReservation } from "@/lib/bin";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type SoItemInput = { itemId: string; qty: number; rate: number };
export type SoInput = { customerId: string; warehouseId: string; deliveryDate?: string | null; remarks?: string; items: SoItemInput[] };

export async function createSalesOrder(input: SoInput) {
  if (!input.customerId) throw new Error("Select a customer");
  if (!input.warehouseId) throw new Error("Select a warehouse");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) { if (!it.itemId) throw new Error("Every row needs an item"); if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive"); }
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count();
  const name = `SO-${year}-${String(count + 1).padStart(5, "0")}`;
  let totalQty = 0, totalAmount = 0;
  const rows = input.items.map((it) => { const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate); totalQty += qty; totalAmount += amount; return { itemId: it.itemId, qty, rate, amount }; });
  const row = await prisma.salesOrder.create({
    data: { name, customerId: input.customerId, warehouseId: input.warehouseId, deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null, remarks: input.remarks?.trim() || null, totalQty, totalAmount: round2(totalAmount), items: { create: rows } },
  });
  revalidatePath("/selling/sales-order");
  return { ok: true, id: row.id, name };
}

export async function submitSalesOrder(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!so) throw new Error("Sales Order not found");
    if (so.status !== "DRAFT") throw new Error("Only draft orders can be submitted");
    for (const it of so.items) await adjustBinReservation(tx, { itemId: it.itemId, warehouseId: so.warehouseId, reservedDelta: it.qty });
    await tx.salesOrder.update({ where: { id: so.id }, data: { status: "TO_FULFILL", submittedAt: new Date() } });
  });
  revalidatePath("/selling/sales-order");
  revalidatePath(`/selling/sales-order/${input.id}`);
  revalidatePath("/stock/balance");
  return { ok: true };
}

export async function cancelSalesOrder(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!so) throw new Error("Sales Order not found");
    if (so.status === "DRAFT") { await tx.salesOrder.update({ where: { id: so.id }, data: { status: "CANCELLED", cancelledAt: new Date() } }); return; }
    if (so.status !== "TO_FULFILL") throw new Error("This order can't be cancelled");
    if (so.items.some((i) => i.deliveredQty > 0)) throw new Error("Goods already delivered against this order — cancel the delivery notes first");
    for (const it of so.items) await adjustBinReservation(tx, { itemId: it.itemId, warehouseId: so.warehouseId, reservedDelta: -(it.qty - it.deliveredQty) });
    await tx.salesOrder.update({ where: { id: so.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/selling/sales-order");
  revalidatePath(`/selling/sales-order/${input.id}`);
  revalidatePath("/stock/balance");
  return { ok: true };
}

/* ---- getters ---- */
export async function getSalesOrders() {
  const rows = await prisma.salesOrder.findMany({ orderBy: { createdAt: "desc" }, include: { customer: { select: { customerName: true } }, _count: { select: { items: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, customer: r.customer.customerName, status: r.status, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), itemCount: r._count.items }));
}
export async function getSalesOrder(id: string) {
  const r = await prisma.salesOrder.findUnique({ where: { id }, include: { customer: { select: { customerName: true } }, warehouse: { select: { warehouseName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, customer: r.customer.customerName, warehouse: r.warehouse.warehouseName, status: r.status, remarks: r.remarks, totalQty: r.totalQty, totalAmount: Number(r.totalAmount),
    items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount), deliveredQty: it.deliveredQty })) };
}

export async function getSoPrefill(id: string) {
  const r = await prisma.salesOrder.findUnique({ where: { id }, include: { items: { include: { item: { select: { id: true, itemCode: true, itemName: true } } } } } });
  if (!r || r.status !== "TO_FULFILL") return null;
  return { id: r.id, name: r.name, customerId: r.customerId, warehouseId: r.warehouseId,
    items: r.items.map((it) => ({ itemId: it.itemId, itemCode: it.item.itemCode, itemName: it.item.itemName, remaining: Math.max(0, Math.round((it.qty - it.deliveredQty) * 1e6) / 1e6), rate: Number(it.rate) })).filter((x) => x.remaining > 0) };
}
