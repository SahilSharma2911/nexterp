"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";

const VT = "Sales Invoice";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type SiItemInput = { itemId: string; qty: number; rate: number };
export type SiInput = { customerId: string; dueDate?: string | null; remarks?: string; items: SiItemInput[] };

export async function createSalesInvoice(input: SiInput) {
  if (!input.customerId) throw new Error("Select a customer");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) { if (!it.itemId) throw new Error("Every row needs an item"); if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive"); }
  const year = new Date().getFullYear();
  const count = await prisma.salesInvoice.count();
  const name = `SINV-${year}-${String(count + 1).padStart(5, "0")}`;
  let total = 0;
  const rows = input.items.map((it) => { const qty = Number(it.qty), rate = Number(it.rate) || 0, amount = round2(qty * rate); total += amount; return { itemId: it.itemId, qty, rate, amount }; });
  const row = await prisma.salesInvoice.create({
    data: { name, customerId: input.customerId, dueDate: input.dueDate ? new Date(input.dueDate) : null, remarks: input.remarks?.trim() || null, total: round2(total), outstanding: round2(total), items: { create: rows } },
  });
  revalidatePath("/accounts/sales-invoice");
  return { ok: true, id: row.id, name };
}

export async function submitSalesInvoice(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const si = await tx.salesInvoice.findUnique({ where: { id: input.id }, include: { customer: true } });
    if (!si) throw new Error("Sales Invoice not found");
    if (si.status !== "DRAFT") throw new Error("Only draft invoices can be submitted");
    const debtors = await getAccountId(tx, "Debtors");
    const sales = await getAccountId(tx, "Sales");
    const total = Number(si.total);
    await postGL(tx, { lines: [{ accountId: debtors, debit: total }, { accountId: sales, credit: total }], voucherType: VT, voucherNo: si.name, postingAt: si.postingAt, againstParty: si.customer.customerName });
    await tx.salesInvoice.update({ where: { id: si.id }, data: { status: "SUBMITTED", submittedAt: new Date(), outstanding: total } });
  });
  revalidatePath("/accounts/sales-invoice");
  revalidatePath(`/accounts/sales-invoice/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function cancelSalesInvoice(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const si = await tx.salesInvoice.findUnique({ where: { id: input.id } });
    if (!si) throw new Error("Sales Invoice not found");
    if (si.status !== "SUBMITTED") throw new Error("Only submitted invoices can be cancelled");
    if (Number(si.outstanding) < Number(si.total)) throw new Error("Payments are applied to this invoice — cancel them first");
    await reverseGL(tx, VT, si.name, new Date());
    await tx.salesInvoice.update({ where: { id: si.id }, data: { status: "CANCELLED", cancelledAt: new Date(), outstanding: 0 } });
  });
  revalidatePath("/accounts/sales-invoice");
  revalidatePath(`/accounts/sales-invoice/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function getSalesInvoices() {
  const rows = await prisma.salesInvoice.findMany({ orderBy: { createdAt: "desc" }, include: { customer: { select: { customerName: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, customer: r.customer.customerName, status: r.status, total: Number(r.total), outstanding: Number(r.outstanding), postingAt: r.postingAt.toISOString() }));
}
export async function getSalesInvoice(id: string) {
  const r = await prisma.salesInvoice.findUnique({ where: { id }, include: { customer: { select: { customerName: true } }, items: { include: { item: { select: { itemCode: true, itemName: true } } } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, customerId: r.customerId, customer: r.customer.customerName, status: r.status, postingAt: r.postingAt.toISOString(), total: Number(r.total), outstanding: Number(r.outstanding), remarks: r.remarks,
    items: r.items.map((it) => ({ id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, qty: it.qty, rate: Number(it.rate), amount: Number(it.amount) })) };
}
// Unpaid invoices for a customer (for payment allocation).
export async function getUnpaidSalesInvoices(customerId: string) {
  const rows = await prisma.salesInvoice.findMany({ where: { customerId, status: "SUBMITTED", outstanding: { gt: 0 } }, orderBy: { postingAt: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, outstanding: Number(r.outstanding) }));
}
