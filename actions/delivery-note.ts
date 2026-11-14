"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postStockLedger } from "@/lib/stock-ledger";

const VT = "Delivery Note";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type DnItemInput = { itemId: string; qty: number; rate: number };
export type DnInput = { customerId: string; warehouseId: string; remarks?: string; items: DnItemInput[] };

export async function createDeliveryNote(input: DnInput) {
  if (!input.customerId) throw new Error("Select a customer");
  if (!input.warehouseId) throw new Error("Select a warehouse to ship from");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
  const year = new Date().getFullYear();
  const count = await prisma.deliveryNote.count();
  const name = `DN-${year}-${String(count + 1).padStart(5, "0")}`;
  let totalQty = 0, totalAmount = 0;
  const rows = input.items.map((it) => {
    const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate);
    totalQty += qty; totalAmount += amount;
    return { itemId: it.itemId, qty, rate, amount };
  });
  const row = await prisma.deliveryNote.create({
    data: { name, customerId: input.customerId, warehouseId: input.warehouseId, remarks: input.remarks?.trim() || null, totalQty, totalAmount: round2(totalAmount), items: { create: rows } },
  });
  revalidatePath("/selling/delivery-note");
  return { ok: true, id: row.id, name };
}

export async function submitDeliveryNote(input: { id: string }) {
  const dn = await prisma.deliveryNote.findUnique({ where: { id: input.id }, include: { items: true } });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "DRAFT") throw new Error("Only draft notes can be submitted");
  await prisma.$transaction(async (tx) => {
    let cogs = 0;
    for (const it of dn.items) {
      const res = await postStockLedger(tx, { itemId: it.itemId, warehouseId: dn.warehouseId, actualQty: -it.qty, voucherType: VT, voucherNo: dn.name, voucherDetailId: it.id, postingAt: dn.postingAt });
      cogs += Math.abs(res.stockValueDifference);
      await tx.deliveryNoteItem.update({ where: { id: it.id }, data: { valuationRate: res.valuationRate } });
    }
    await tx.deliveryNote.update({ where: { id: dn.id }, data: { status: "SUBMITTED", submittedAt: new Date(), totalCogs: round2(cogs) } });
  });
  revalidatePath("/selling/delivery-note");
  revalidatePath(`/selling/delivery-note/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

export async function cancelDeliveryNote(input: { id: string }) {
  const dn = await prisma.deliveryNote.findUnique({ where: { id: input.id } });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "SUBMITTED") throw new Error("Only submitted notes can be cancelled");
  await prisma.$transaction(async (tx) => {
    const sles = await tx.stockLedgerEntry.findMany({ where: { voucherType: VT, voucherNo: dn.name, isCancelled: false } });
    for (const s of sles) {
      // Re-add the delivered stock at the rate it left (its valuation).
      await postStockLedger(tx, { itemId: s.itemId, warehouseId: s.warehouseId, actualQty: -s.actualQty, incomingRate: Number(s.valuationRate), voucherType: VT, voucherNo: dn.name, voucherDetailId: s.voucherDetailId, postingAt: new Date() });
    }
    await tx.stockLedgerEntry.updateMany({ where: { voucherType: VT, voucherNo: dn.name, isCancelled: false }, data: { isCancelled: true } });
    await tx.deliveryNote.update({ where: { id: dn.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/selling/delivery-note");
  revalidatePath(`/selling/delivery-note/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

/* ---- getters ---- */
export async function getDeliveryNotes() {
  const rows = await prisma.deliveryNote.findMany({ orderBy: { createdAt: "desc" }, include: { customer: { select: { customerName: true } }, warehouse: { select: { warehouseName: true } }, _count: { select: { items: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, customer: r.customer.customerName, warehouse: r.warehouse.warehouseName, status: r.status, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), itemCount: r._count.items, postingAt: r.postingAt.toISOString() }));
}
export async function getDeliveryNote(id: string) {
  const r = await prisma.deliveryNote.findUnique({ where: { id }, include: { customer: { select: { customerName: true } }, warehouse: { select: { warehouseName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true, stockUom: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, customer: r.customer.customerName, warehouse: r.warehouse.warehouseName, status: r.status, postingAt: r.postingAt.toISOString(), remarks: r.remarks, totalQty: r.totalQty, totalAmount: Number(r.totalAmount), totalCogs: Number(r.totalCogs), items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, uom: it.uom, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount), valuationRate: Number(it.valuationRate) })) };
}
