import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";
import type {
  SalesInvoiceDetail,
  SalesInvoiceFormValues,
  SalesInvoiceListItem,
} from "@/features/sales-invoice/schema";

const VT = "Sales Invoice";
const SORTABLE = ["name", "total", "outstanding", "postingAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function priceItems(items: SalesInvoiceFormValues["items"]) {
  let total = 0;
  const rows = items.map((it) => {
    const qty = Number(it.qty);
    const rate = Number(it.rate) || 0;
    const amount = round2(qty * rate);
    total += amount;
    return { itemId: it.itemId, qty, rate, amount };
  });
  return { rows, total: round2(total) };
}

export async function listSalesInvoices(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<SalesInvoiceListItem>> {
  const where: Prisma.SalesInvoiceWhereInput = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.SalesInvoiceWhereInput["status"];
  }
  if (p.search) {
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { customer: { customerName: { contains: p.search, mode: "insensitive" } } },
    ];
  }
  const orderBy = parseSort(p.sort, SORTABLE, { postingAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.salesInvoice.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { customer: { select: { customerName: true } } },
    }),
    prisma.salesInvoice.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      customer: r.customer.customerName,
      status: r.status,
      total: Number(r.total),
      outstanding: Number(r.outstanding),
      postingAt: r.postingAt.toISOString(),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getSalesInvoice(
  id: string,
): Promise<SalesInvoiceDetail | null> {
  const r = await prisma.salesInvoice.findUnique({
    where: { id },
    include: {
      customer: { select: { customerName: true } },
      items: {
        include: { item: { select: { itemCode: true, itemName: true } } },
      },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    customerId: r.customerId,
    customer: r.customer.customerName,
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
    total: Number(r.total),
    outstanding: Number(r.outstanding),
    remarks: r.remarks,
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      qty: it.qty,
      rate: Number(it.rate),
      amount: Number(it.amount),
    })),
  };
}

export async function createSalesInvoice(
  values: SalesInvoiceFormValues,
): Promise<{ id: string; name: string }> {
  const { rows, total } = priceItems(values.items);
  const year = new Date().getFullYear();
  const count = await prisma.salesInvoice.count();
  const name = `SINV-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.salesInvoice.create({
    data: {
      name,
      customerId: values.customerId,
      dueDate: values.dueDate ? new Date(values.dueDate) : null,
      remarks: values.remarks?.trim() || null,
      total,
      outstanding: total,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updateSalesInvoice(
  id: string,
  values: SalesInvoiceFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.salesInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Sales Invoice not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft invoices can be edited");

  const { rows, total } = priceItems(values.items);
  const row = await prisma.$transaction(async (tx) => {
    await tx.salesInvoiceItem.deleteMany({ where: { salesInvoiceId: id } });
    return tx.salesInvoice.update({
      where: { id },
      data: {
        customerId: values.customerId,
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        remarks: values.remarks?.trim() || null,
        total,
        outstanding: total,
        items: { create: rows },
      },
    });
  });
  return { id: row.id, name: row.name };
}

export async function deleteSalesInvoice(id: string): Promise<void> {
  const existing = await prisma.salesInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Sales Invoice not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft invoices can be deleted");
  await prisma.salesInvoice.delete({ where: { id } });
}

export async function submitSalesInvoice(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const si = await tx.salesInvoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!si) throw new Error("Sales Invoice not found");
    if (si.status !== "DRAFT")
      throw new Error("Only draft invoices can be submitted");
    const debtors = await getAccountId(tx, "Debtors");
    const sales = await getAccountId(tx, "Sales");
    const total = Number(si.total);
    await postGL(tx, {
      lines: [
        { accountId: debtors, debit: total },
        { accountId: sales, credit: total },
      ],
      voucherType: VT,
      voucherNo: si.name,
      postingAt: si.postingAt,
      againstParty: si.customer.customerName,
    });
    await tx.salesInvoice.update({
      where: { id: si.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), outstanding: total },
    });
  });
}

export async function cancelSalesInvoice(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const si = await tx.salesInvoice.findUnique({ where: { id } });
    if (!si) throw new Error("Sales Invoice not found");
    if (si.status !== "SUBMITTED")
      throw new Error("Only submitted invoices can be cancelled");
    if (Number(si.outstanding) < Number(si.total))
      throw new Error(
        "Payments are applied to this invoice — cancel them first",
      );
    await reverseGL(tx, VT, si.name, new Date());
    await tx.salesInvoice.update({
      where: { id: si.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), outstanding: 0 },
    });
  });
}

// Unpaid submitted invoices for a customer (payment allocation).
export async function unpaidSalesInvoices(customerId: string) {
  const rows = await prisma.salesInvoice.findMany({
    where: { customerId, status: "SUBMITTED", outstanding: { gt: 0 } },
    orderBy: { postingAt: "asc" },
    select: { id: true, name: true, outstanding: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    outstanding: Number(r.outstanding),
  }));
}
