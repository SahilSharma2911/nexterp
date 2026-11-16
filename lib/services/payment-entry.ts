import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";
import type {
  PaymentEntryDetail,
  PaymentEntryFormValues,
  PaymentEntryListItem,
} from "@/features/payment-entry/schema";

const VT = "Payment Entry";
const SORTABLE = ["name", "amount", "postingAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function listPaymentEntries(
  p: ListParams,
  filters: { status?: string; type?: string },
): Promise<ListResponse<PaymentEntryListItem>> {
  const where: Prisma.PaymentEntryWhereInput = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.PaymentEntryWhereInput["status"];
  }
  if (filters.type && filters.type !== "all") {
    where.paymentType =
      filters.type as Prisma.PaymentEntryWhereInput["paymentType"];
  }
  if (p.search) {
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { customer: { customerName: { contains: p.search, mode: "insensitive" } } },
      { supplier: { supplierName: { contains: p.search, mode: "insensitive" } } },
      { account: { accountName: { contains: p.search, mode: "insensitive" } } },
    ];
  }
  const orderBy = parseSort(p.sort, SORTABLE, { postingAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.paymentEntry.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        account: { select: { accountName: true } },
        customer: { select: { customerName: true } },
        supplier: { select: { supplierName: true } },
      },
    }),
    prisma.paymentEntry.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      paymentType: r.paymentType,
      party: r.customer?.customerName ?? r.supplier?.supplierName ?? "—",
      account: r.account.accountName,
      amount: Number(r.amount),
      status: r.status,
      postingAt: r.postingAt.toISOString(),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getPaymentEntry(
  id: string,
): Promise<PaymentEntryDetail | null> {
  const r = await prisma.paymentEntry.findUnique({
    where: { id },
    include: {
      account: { select: { accountName: true } },
      customer: { select: { customerName: true } },
      supplier: { select: { supplierName: true } },
      salesInvoice: { select: { name: true } },
      purchaseInvoice: { select: { name: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    paymentType: r.paymentType,
    accountId: r.accountId,
    account: r.account.accountName,
    customerId: r.customerId,
    supplierId: r.supplierId,
    salesInvoiceId: r.salesInvoiceId,
    purchaseInvoiceId: r.purchaseInvoiceId,
    party: r.customer?.customerName ?? r.supplier?.supplierName ?? "—",
    invoice: r.salesInvoice?.name ?? r.purchaseInvoice?.name ?? null,
    amount: Number(r.amount),
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    remarks: r.remarks,
  };
}

export async function createPaymentEntry(
  values: PaymentEntryFormValues,
): Promise<{ id: string; name: string }> {
  const amount = round2(Number(values.amount));
  const year = new Date().getFullYear();
  const count = await prisma.paymentEntry.count();
  const name = `PAY-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.paymentEntry.create({
    data: {
      name,
      paymentType: values.paymentType,
      accountId: values.accountId,
      customerId:
        values.paymentType === "RECEIVE" ? values.customerId || null : null,
      supplierId:
        values.paymentType === "PAY" ? values.supplierId || null : null,
      salesInvoiceId: values.salesInvoiceId || null,
      purchaseInvoiceId: values.purchaseInvoiceId || null,
      amount,
      remarks: values.remarks?.trim() || null,
    },
  });
  return { id: row.id, name };
}

export async function updatePaymentEntry(
  id: string,
  values: PaymentEntryFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.paymentEntry.findUnique({ where: { id } });
  if (!existing) throw new Error("Payment Entry not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft payments can be edited");
  const amount = round2(Number(values.amount));
  const row = await prisma.paymentEntry.update({
    where: { id },
    data: {
      paymentType: values.paymentType,
      accountId: values.accountId,
      customerId:
        values.paymentType === "RECEIVE" ? values.customerId || null : null,
      supplierId:
        values.paymentType === "PAY" ? values.supplierId || null : null,
      salesInvoiceId: values.salesInvoiceId || null,
      purchaseInvoiceId: values.purchaseInvoiceId || null,
      amount,
      remarks: values.remarks?.trim() || null,
    },
  });
  return { id: row.id, name: row.name };
}

export async function deletePaymentEntry(id: string): Promise<void> {
  const existing = await prisma.paymentEntry.findUnique({ where: { id } });
  if (!existing) throw new Error("Payment Entry not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft payments can be deleted");
  await prisma.paymentEntry.delete({ where: { id } });
}

export async function submitPaymentEntry(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pe = await tx.paymentEntry.findUnique({
      where: { id },
      include: { customer: true, supplier: true },
    });
    if (!pe) throw new Error("Payment Entry not found");
    if (pe.status !== "DRAFT")
      throw new Error("Only draft payments can be submitted");
    const amount = Number(pe.amount);
    if (pe.paymentType === "RECEIVE") {
      const debtors = await getAccountId(tx, "Debtors");
      await postGL(tx, {
        lines: [
          { accountId: pe.accountId, debit: amount },
          { accountId: debtors, credit: amount },
        ],
        voucherType: VT,
        voucherNo: pe.name,
        postingAt: pe.postingAt,
        againstParty: pe.customer?.customerName,
      });
      if (pe.salesInvoiceId)
        await tx.salesInvoice.update({
          where: { id: pe.salesInvoiceId },
          data: { outstanding: { decrement: amount } },
        });
    } else {
      const creditors = await getAccountId(tx, "Creditors");
      await postGL(tx, {
        lines: [
          { accountId: creditors, debit: amount },
          { accountId: pe.accountId, credit: amount },
        ],
        voucherType: VT,
        voucherNo: pe.name,
        postingAt: pe.postingAt,
        againstParty: pe.supplier?.supplierName,
      });
      if (pe.purchaseInvoiceId)
        await tx.purchaseInvoice.update({
          where: { id: pe.purchaseInvoiceId },
          data: { outstanding: { decrement: amount } },
        });
    }
    await tx.paymentEntry.update({
      where: { id: pe.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });
}

export async function cancelPaymentEntry(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pe = await tx.paymentEntry.findUnique({ where: { id } });
    if (!pe) throw new Error("Payment Entry not found");
    if (pe.status !== "SUBMITTED")
      throw new Error("Only submitted payments can be cancelled");
    await reverseGL(tx, VT, pe.name, new Date());
    const amount = Number(pe.amount);
    if (pe.paymentType === "RECEIVE" && pe.salesInvoiceId)
      await tx.salesInvoice.update({
        where: { id: pe.salesInvoiceId },
        data: { outstanding: { increment: amount } },
      });
    if (pe.paymentType === "PAY" && pe.purchaseInvoiceId)
      await tx.purchaseInvoice.update({
        where: { id: pe.purchaseInvoiceId },
        data: { outstanding: { increment: amount } },
      });
    await tx.paymentEntry.update({
      where: { id: pe.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
