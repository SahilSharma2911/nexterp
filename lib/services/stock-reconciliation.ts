import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setStockBalance } from "@/lib/stock-ledger";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  ReconciliationDetail,
  ReconciliationFormValues,
  ReconciliationListItem,
} from "@/features/stock-reconciliation/schema";

const VOUCHER_TYPE = "Stock Reconciliation";
const SORTABLE = ["name", "postingAt", "status", "createdAt"] as const;

type Filters = { status?: string };

function validate(input: ReconciliationFormValues) {
  if (!input.items?.length) throw new Error("Add at least one row");
  for (const it of input.items) {
    if (!it.itemId || !it.warehouseId)
      throw new Error("Every row needs an item and a warehouse");
    if (!(Number(it.qty) >= 0))
      throw new Error("Counted quantity can't be negative");
  }
}

function itemsCreate(input: ReconciliationFormValues) {
  return input.items.map((it) => ({
    itemId: it.itemId,
    warehouseId: it.warehouseId,
    qty: Number(it.qty),
    valuationRate: it.valuationRate == null ? 0 : Number(it.valuationRate),
  }));
}

export async function listStockReconciliations(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<ReconciliationListItem>> {
  const where: Prisma.StockReconciliationWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.stockReconciliation.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { items: true } } },
    }),
    prisma.stockReconciliation.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      postingAt: r.postingAt.toISOString(),
      itemCount: r._count.items,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getStockReconciliation(
  id: string,
): Promise<ReconciliationDetail | null> {
  const r = await prisma.stockReconciliation.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          item: { select: { itemCode: true, itemName: true, stockUom: true } },
          warehouse: { select: { warehouseName: true } },
        },
      },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    remarks: r.remarks,
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      uom: it.item.stockUom,
      warehouseId: it.warehouseId,
      warehouse: it.warehouse.warehouseName,
      qty: it.qty,
      valuationRate: Number(it.valuationRate),
      currentQty: it.currentQty,
      diff:
        r.status === "DRAFT"
          ? null
          : Math.round((it.qty - it.currentQty) * 1e6) / 1e6,
    })),
  };
}

export async function createStockReconciliation(
  input: ReconciliationFormValues,
) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.stockReconciliation.count();
  const name = `SR-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.stockReconciliation.create({
    data: {
      name,
      status: "DRAFT",
      remarks: input.remarks?.trim() || null,
      items: { create: itemsCreate(input) },
    },
  });
  return { id: row.id, name };
}

export async function updateStockReconciliation(
  id: string,
  input: ReconciliationFormValues,
) {
  validate(input);
  const rec = await prisma.stockReconciliation.findUnique({ where: { id } });
  if (!rec) throw new Error("Stock Reconciliation not found");
  if (rec.status !== "DRAFT")
    throw new Error("Only draft reconciliations can be edited");
  await prisma.$transaction(async (tx) => {
    await tx.stockReconciliationItem.deleteMany({
      where: { reconciliationId: id },
    });
    await tx.stockReconciliation.update({
      where: { id },
      data: {
        remarks: input.remarks?.trim() || null,
        items: { create: itemsCreate(input) },
      },
    });
  });
  return { id, name: rec.name };
}

export async function deleteStockReconciliation(id: string) {
  const rec = await prisma.stockReconciliation.findUnique({ where: { id } });
  if (!rec) throw new Error("Stock Reconciliation not found");
  if (rec.status !== "DRAFT")
    throw new Error("Only draft reconciliations can be deleted");
  await prisma.stockReconciliation.delete({ where: { id } });
}

export async function submitStockReconciliation(id: string) {
  await prisma.$transaction(async (tx) => {
    const rec = await tx.stockReconciliation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!rec) throw new Error("Stock Reconciliation not found");
    if (rec.status !== "DRAFT")
      throw new Error("Only draft reconciliations can be submitted");

    for (const it of rec.items) {
      const bin = await tx.bin.findUnique({
        where: {
          itemId_warehouseId: {
            itemId: it.itemId,
            warehouseId: it.warehouseId,
          },
        },
      });
      const currentQty = bin?.actualQty ?? 0;
      const currentRate = bin ? Number(bin.valuationRate) : 0;
      const targetRate =
        Number(it.valuationRate) > 0 ? Number(it.valuationRate) : currentRate;
      await setStockBalance(tx, {
        itemId: it.itemId,
        warehouseId: it.warehouseId,
        qty: it.qty,
        rate: targetRate,
        voucherType: VOUCHER_TYPE,
        voucherNo: rec.name,
        voucherDetailId: it.id,
        postingAt: rec.postingAt,
      });
      await tx.stockReconciliationItem.update({
        where: { id: it.id },
        data: { currentQty, currentRate },
      });
    }
    await tx.stockReconciliation.update({
      where: { id: rec.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });
}

export async function cancelStockReconciliation(id: string) {
  await prisma.$transaction(async (tx) => {
    const rec = await tx.stockReconciliation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!rec) throw new Error("Stock Reconciliation not found");
    if (rec.status !== "SUBMITTED")
      throw new Error("Only submitted reconciliations can be cancelled");

    await tx.stockLedgerEntry.updateMany({
      where: {
        voucherType: VOUCHER_TYPE,
        voucherNo: rec.name,
        isCancelled: false,
      },
      data: { isCancelled: true },
    });
    for (const it of rec.items) {
      await setStockBalance(tx, {
        itemId: it.itemId,
        warehouseId: it.warehouseId,
        qty: it.currentQty,
        rate: Number(it.currentRate),
        voucherType: VOUCHER_TYPE,
        voucherNo: rec.name,
        voucherDetailId: it.id,
        postingAt: new Date(),
      });
    }
    await tx.stockReconciliation.update({
      where: { id: rec.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
