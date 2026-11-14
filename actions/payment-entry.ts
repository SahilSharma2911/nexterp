"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";

const VT = "Payment Entry";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type PaymentInput = {
  paymentType: "RECEIVE" | "PAY";
  accountId: string;
  customerId?: string | null;
  supplierId?: string | null;
  salesInvoiceId?: string | null;
  purchaseInvoiceId?: string | null;
  amount: number;
  remarks?: string;
};

export async function createPaymentEntry(input: PaymentInput) {
  if (!input.accountId) throw new Error("Select the cash/bank account");
  const amount = Number(input.amount);
  if (!(amount > 0)) throw new Error("Amount must be positive");
  if (input.paymentType === "RECEIVE" && !input.customerId) throw new Error("Select the customer");
  if (input.paymentType === "PAY" && !input.supplierId) throw new Error("Select the supplier");
  const year = new Date().getFullYear();
  const count = await prisma.paymentEntry.count();
  const name = `PAY-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.paymentEntry.create({
    data: { name, paymentType: input.paymentType, accountId: input.accountId, customerId: input.customerId || null, supplierId: input.supplierId || null, salesInvoiceId: input.salesInvoiceId || null, purchaseInvoiceId: input.purchaseInvoiceId || null, amount: round2(amount), remarks: input.remarks?.trim() || null },
  });
  revalidatePath("/accounts/payment-entry");
  return { ok: true, id: row.id, name };
}

export async function submitPaymentEntry(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const pe = await tx.paymentEntry.findUnique({ where: { id: input.id }, include: { customer: true, supplier: true } });
    if (!pe) throw new Error("Payment Entry not found");
    if (pe.status !== "DRAFT") throw new Error("Only draft payments can be submitted");
    const amount = Number(pe.amount);
    if (pe.paymentType === "RECEIVE") {
      const debtors = await getAccountId(tx, "Debtors");
      await postGL(tx, { lines: [{ accountId: pe.accountId, debit: amount }, { accountId: debtors, credit: amount }], voucherType: VT, voucherNo: pe.name, postingAt: pe.postingAt, againstParty: pe.customer?.customerName });
      if (pe.salesInvoiceId) await tx.salesInvoice.update({ where: { id: pe.salesInvoiceId }, data: { outstanding: { decrement: amount } } });
    } else {
      const creditors = await getAccountId(tx, "Creditors");
      await postGL(tx, { lines: [{ accountId: creditors, debit: amount }, { accountId: pe.accountId, credit: amount }], voucherType: VT, voucherNo: pe.name, postingAt: pe.postingAt, againstParty: pe.supplier?.supplierName });
      if (pe.purchaseInvoiceId) await tx.purchaseInvoice.update({ where: { id: pe.purchaseInvoiceId }, data: { outstanding: { decrement: amount } } });
    }
    await tx.paymentEntry.update({ where: { id: pe.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
  });
  revalidatePath("/accounts/payment-entry");
  revalidatePath(`/accounts/payment-entry/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function cancelPaymentEntry(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const pe = await tx.paymentEntry.findUnique({ where: { id: input.id } });
    if (!pe) throw new Error("Payment Entry not found");
    if (pe.status !== "SUBMITTED") throw new Error("Only submitted payments can be cancelled");
    await reverseGL(tx, VT, pe.name, new Date());
    const amount = Number(pe.amount);
    if (pe.paymentType === "RECEIVE" && pe.salesInvoiceId) await tx.salesInvoice.update({ where: { id: pe.salesInvoiceId }, data: { outstanding: { increment: amount } } });
    if (pe.paymentType === "PAY" && pe.purchaseInvoiceId) await tx.purchaseInvoice.update({ where: { id: pe.purchaseInvoiceId }, data: { outstanding: { increment: amount } } });
    await tx.paymentEntry.update({ where: { id: pe.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/accounts/payment-entry");
  revalidatePath(`/accounts/payment-entry/${input.id}`);
  revalidatePath("/accounts/general-ledger");
  revalidatePath("/accounts/trial-balance");
  return { ok: true };
}

export async function getPaymentEntries() {
  const rows = await prisma.paymentEntry.findMany({ orderBy: { createdAt: "desc" }, include: { account: { select: { accountName: true } }, customer: { select: { customerName: true } }, supplier: { select: { supplierName: true } } } });
  return rows.map((r) => ({ id: r.id, name: r.name, paymentType: r.paymentType, party: r.customer?.customerName ?? r.supplier?.supplierName ?? "—", account: r.account.accountName, amount: Number(r.amount), status: r.status }));
}
export async function getPaymentEntry(id: string) {
  const r = await prisma.paymentEntry.findUnique({ where: { id }, include: { account: { select: { accountName: true } }, customer: { select: { customerName: true } }, supplier: { select: { supplierName: true } }, salesInvoice: { select: { name: true } }, purchaseInvoice: { select: { name: true } } } });
  if (!r) return null;
  return { id: r.id, name: r.name, paymentType: r.paymentType, party: r.customer?.customerName ?? r.supplier?.supplierName ?? "—", account: r.account.accountName, amount: Number(r.amount), status: r.status, postingAt: r.postingAt.toISOString(), invoice: r.salesInvoice?.name ?? r.purchaseInvoice?.name ?? null, remarks: r.remarks };
}
