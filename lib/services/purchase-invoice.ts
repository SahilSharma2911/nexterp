import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";
import type {
  PurchaseInvoiceDetail,
  PurchaseInvoiceFormValues,
  PurchaseInvoiceListItem,
} from "@/features/purchase-invoice/schema";

const VT = "Purchase Invoice";
const SORTABLE = ["name", "total", "outstanding", "postingAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function priceItems(items: PurchaseInvoiceFormValues["items"]) {
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

export async function listPurchaseInvoices(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<PurchaseInvoiceListItem>> {
  const where: Prisma.PurchaseInvoiceWhereInput = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.PurchaseInvoiceWhereInput["status"];
  }
  if (p.search) {
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { supplier: { supplierName: { contains: p.search, mode: "insensitive" } } },
    ];
  }
  const orderBy = parseSort(p.sort, SORTABLE, { postingAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { supplier: { select: { supplierName: true } } },
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      supplier: r.supplier.supplierName,
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

export async function getPurchaseInvoice(
  id: string,
): Promise<PurchaseInvoiceDetail | null> {
  const r = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      supplier: { select: { supplierName: true } },
      items: {
        include: { item: { select: { itemCode: true, itemName: true } } },
      },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    supplierId: r.supplierId,
    supplier: r.supplier.supplierName,
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

export async function createPurchaseInvoice(
  values: PurchaseInvoiceFormValues,
): Promise<{ id: string; name: string }> {
  const { rows, total } = priceItems(values.items);
  const year = new Date().getFullYear();
  const count = await prisma.purchaseInvoice.count();
  const name = `PINV-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.purchaseInvoice.create({
    data: {
      name,
      supplierId: values.supplierId,
      dueDate: values.dueDate ? new Date(values.dueDate) : null,
      remarks: values.remarks?.trim() || null,
      total,
      outstanding: total,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updatePurchaseInvoice(
  id: string,
  values: PurchaseInvoiceFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.purchaseInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Purchase Invoice not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft invoices can be edited");

  const { rows, total } = priceItems(values.items);
  const row = await prisma.$transaction(async (tx) => {
    await tx.purchaseInvoiceItem.deleteMany({ where: { purchaseInvoiceId: id } });
    return tx.purchaseInvoice.update({
      where: { id },
      data: {
        supplierId: values.supplierId,
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

export async function deletePurchaseInvoice(id: string): Promise<void> {
  const existing = await prisma.purchaseInvoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Purchase Invoice not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft invoices can be deleted");
  await prisma.purchaseInvoice.delete({ where: { id } });
}

export async function submitPurchaseInvoice(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pi = await tx.purchaseInvoice.findUnique({
      where: { id },
      include: { supplier: true },
    });
    if (!pi) throw new Error("Purchase Invoice not found");
    if (pi.status !== "DRAFT")
      throw new Error("Only draft invoices can be submitted");
    const cogs = await getAccountId(tx, "Cost of Goods Sold");
    const creditors = await getAccountId(tx, "Creditors");
    const total = Number(pi.total);
    await postGL(tx, {
      lines: [
        { accountId: cogs, debit: total },
        { accountId: creditors, credit: total },
      ],
      voucherType: VT,
      voucherNo: pi.name,
      postingAt: pi.postingAt,
      againstParty: pi.supplier.supplierName,
    });
    await tx.purchaseInvoice.update({
      where: { id: pi.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), outstanding: total },
    });
  });
}

export async function cancelPurchaseInvoice(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const pi = await tx.purchaseInvoice.findUnique({ where: { id } });
    if (!pi) throw new Error("Purchase Invoice not found");
    if (pi.status !== "SUBMITTED")
      throw new Error("Only submitted invoices can be cancelled");
    if (Number(pi.outstanding) < Number(pi.total))
      throw new Error(
        "Payments are applied to this invoice — cancel them first",
      );
    await reverseGL(tx, VT, pi.name, new Date());
    await tx.purchaseInvoice.update({
      where: { id: pi.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), outstanding: 0 },
    });
  });
}

// Unpaid submitted invoices for a supplier (payment allocation).
export async function unpaidPurchaseInvoices(supplierId: string) {
  const rows = await prisma.purchaseInvoice.findMany({
    where: { supplierId, status: "SUBMITTED", outstanding: { gt: 0 } },
    orderBy: { postingAt: "asc" },
    select: { id: true, name: true, outstanding: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    outstanding: Number(r.outstanding),
  }));
}
