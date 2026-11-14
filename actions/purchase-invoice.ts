"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";

const VT = "Purchase Invoice";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type PiItemInput = { itemId: string; qty: number; rate: number };
export type PiInput = { supplierId: string; dueDate?: string | null; remarks?: string; items: PiItemInput[] };

export async function createPurchaseInvoice(input: PiInput) {
  if (!input.supplierId) throw new Error("Select a supplier");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) { if (!it.itemId) throw new Error("Every row needs an item"); if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive"); }
  const year = new Date().getFullYear();
  const count = await prisma.purchaseInvoice.count();
  const name = `PINV-${year}-${String(count + 1).padStart(5, "0")}`;
  let total = 0;
  const rows = input.items.map((it) => { const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate); total += amount; return { itemId: it.itemId, qty, rate, amount }; });
  const row = await prisma.purchaseInvoice.create({
    data: { name, supplierId: input.supplierId, dueDate: input.dueDate ? new Date(input.dueDate) : null, remarks: input.remarks?.trim() || null, total: round2(total), outstanding: round2(total), items: { create: rows } },
  });
  revalidatePath("/accounts/purchase-invoice");
  return { ok: true, id: row.id, name };
}

export async function submitPurchaseInvoice(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const pi = await tx.purchaseInvoice.findUnique({ where: { id: input.id }, include: { supplier: true } });
    if (!pi) throw new Error("Purchase Invoice not found");
    if (pi.status !== "DRAFT") throw new Error("Only draft invoices can be submitted");
    const expense = await getAccountId(tx, "Cost of Goods Sold");
    const creditors = await getAccountId(tx, "Creditors");
    const total = Number(pi.total);
    await postGL(tx, { lines: [{ accountId: expense, debit: total }, { accountId: creditors, credit: total }], voucherType: VT, voucherNo: pi.name, postingAt: pi.postingAt, againstParty: pi.supplier.supplierName });
    await tx.purchaseInvoice.update({ where: { id: pi.id }, data: { status: "SUBMITTED", submittedAt: new Date(), outstanding: total } });
  });
  revalidatePath("/accounts/purchase-invoice");
  revalidatePath(`/accounts/purchase-invoice/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function cancelPurchaseInvoice(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const pi = await tx.purchaseInvoice.findUnique({ where: { id: input.id } });
    if (!pi) throw new Error("Purchase Invoice not found");
    if (pi.status !== "SUBMITTED") throw new Error("Only submitted invoices can be cancelled");
    if (Number(pi.outstanding) < Number(pi.total)) throw new Error("Payments are applied to this invoice — cancel them first");
    await reverseGL(tx, VT, pi.name, new Date());
    await tx.purchaseInvoice.update({ where: { id: pi.id }, data: { status: "CANCELLED", cancelledAt: new Date(), outstanding: 0 } });
  });
  revalidatePath("/accounts/purchase-invoice");
  revalidatePath(`/accounts/purchase-invoice/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function getPurchaseInvoices() {
  const rows = await prisma.purchaseInvoice.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: { select: { supplierName: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, supplier: r.supplier.supplierName, status: r.status, total: Number(r.total), outstanding: Number(r.outstanding), postingAt: r.postingAt.toISOString() }));
}
export async function getPurchaseInvoice(id: string) {
  const r = await prisma.purchaseInvoice.findUnique({ where: { id }, include: { supplier: { select: { supplierName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, supplierId: r.supplierId, supplier: r.supplier.supplierName, status: r.status, postingAt: r.postingAt.toISOString(), total: Number(r.total), outstanding: Number(r.outstanding), remarks: r.remarks,
    items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount) })) };
}
export async function getUnpaidPurchaseInvoices(supplierId: string) {
  const rows = await prisma.purchaseInvoice.findMany({ where: { supplierId, status: "SUBMITTED", outstanding: { gt: 0 } }, orderBy: { postingAt: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, outstanding: Number(r.outstanding) }));
}
