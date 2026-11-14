import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustBinReservation } from "@/lib/bin";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  PurchaseOrderDetail,
  PurchaseOrderFormValues,
  PurchaseOrderListItem,
} from "@/features/purchase-order/schema";

const SORTABLE = ["name", "totalQty", "totalAmount", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type Filters = { status?: string };

function validate(input: PurchaseOrderFormValues) {
  if (!input.supplierId) throw new Error("Select a supplier");
  if (!input.warehouseId) throw new Error("Select a warehouse");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
}

function buildRows(input: PurchaseOrderFormValues) {
  let totalQty = 0;
  let totalAmount = 0;
  const rows = input.items.map((it) => {
    const qty = Number(it.qty);
    const rate = Number(it.rate) || 0;
    const amount = round2(qty * rate);
    totalQty += qty;
    totalAmount += amount;
    return { itemId: it.itemId, qty, rate, amount };
  });
  return { rows, totalQty, totalAmount: round2(totalAmount) };
}

export async function listPurchaseOrders(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<PurchaseOrderListItem>> {
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        supplier: { select: { supplierName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      supplier: r.supplier.supplierName,
      status: r.status,
      totalQty: r.totalQty,
      totalAmount: Number(r.totalAmount),
      itemCount: r._count.items,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getPurchaseOrder(
  id: string,
): Promise<PurchaseOrderDetail | null> {
  const r = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { supplierName: true } },
      warehouse: { select: { warehouseName: true } },
      items: { include: { item: { select: { itemCode: true, itemName: true } } } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    supplierId: r.supplierId,
    warehouseId: r.warehouseId,
    supplier: r.supplier.supplierName,
    warehouse: r.warehouse.warehouseName,
    status: r.status,
    remarks: r.remarks,
    totalQty: r.totalQty,
    totalAmount: Number(r.totalAmount),
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      qty: it.qty,
      rate: Number(it.rate),
      amount: Number(it.amount),
      receivedQty: it.receivedQty,
    })),
  };
}

// Remaining-qty prefill for creating a Purchase Receipt against this PO.
export async function purchaseOrderPrefill(id: string) {
  const r = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: { item: { select: { itemCode: true, itemName: true } } },
      },
    },
  });
  if (!r || r.status !== "TO_FULFILL") return null;
  return {
    id: r.id,
    name: r.name,
    supplierId: r.supplierId,
    warehouseId: r.warehouseId,
    items: r.items
      .map((it) => ({
        itemId: it.itemId,
        itemCode: it.item.itemCode,
        itemName: it.item.itemName,
        remaining: Math.max(0, Math.round((it.qty - it.receivedQty) * 1e6) / 1e6),
        rate: Number(it.rate),
      }))
      .filter((x) => x.remaining > 0),
  };
}

export async function createPurchaseOrder(input: PurchaseOrderFormValues) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  const name = `PO-${year}-${String(count + 1).padStart(5, "0")}`;
  const { rows, totalQty, totalAmount } = buildRows(input);
  const row = await prisma.purchaseOrder.create({
    data: {
      name,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      requiredBy: input.requiredBy ? new Date(input.requiredBy) : null,
      remarks: input.remarks?.trim() || null,
      totalQty,
      totalAmount,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updatePurchaseOrder(
  id: string,
  input: PurchaseOrderFormValues,
) {
  validate(input);
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase Order not found");
  if (po.status !== "DRAFT")
    throw new Error("Only draft orders can be edited");
  const { rows, totalQty, totalAmount } = buildRows(input);
  await prisma.$transaction([
    prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } }),
    prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        requiredBy: input.requiredBy ? new Date(input.requiredBy) : null,
        remarks: input.remarks?.trim() || null,
        totalQty,
        totalAmount,
        items: { create: rows },
      },
    }),
  ]);
  return { id, name: po.name };
}

export async function deletePurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase Order not found");
  if (po.status !== "DRAFT") throw new Error("Only draft orders can be deleted");
  await prisma.purchaseOrder.delete({ where: { id } });
}

export async function submitPurchaseOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new Error("Purchase Order not found");
    if (po.status !== "DRAFT") throw new Error("Only draft orders can be submitted");
    for (const it of po.items)
      await adjustBinReservation(tx, {
        itemId: it.itemId,
        warehouseId: po.warehouseId,
        orderedDelta: it.qty,
      });
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: "TO_FULFILL", submittedAt: new Date() },
    });
  });
}

export async function cancelPurchaseOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new Error("Purchase Order not found");
    if (po.status === "DRAFT") {
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      return;
    }
    if (po.status !== "TO_FULFILL") throw new Error("This order can't be cancelled");
    if (po.items.some((i) => i.receivedQty > 0))
      throw new Error("Goods already received against this order — cancel the receipts first");
    for (const it of po.items)
      await adjustBinReservation(tx, {
        itemId: it.itemId,
        warehouseId: po.warehouseId,
        orderedDelta: -(it.qty - it.receivedQty),
      });
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
