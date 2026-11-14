import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustBinReservation } from "@/lib/bin";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  SalesOrderDetail,
  SalesOrderFormValues,
  SalesOrderListItem,
} from "@/features/sales-order/schema";

const SORTABLE = ["name", "totalQty", "totalAmount", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type Filters = { status?: string };

function validate(input: SalesOrderFormValues) {
  if (!input.customerId) throw new Error("Select a customer");
  if (!input.warehouseId) throw new Error("Select a warehouse");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
}

function buildRows(input: SalesOrderFormValues) {
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

export async function listSalesOrders(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<SalesOrderListItem>> {
  const where: Prisma.SalesOrderWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        customer: { select: { customerName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      customer: r.customer.customerName,
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

export async function getSalesOrder(
  id: string,
): Promise<SalesOrderDetail | null> {
  const r = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { select: { customerName: true } },
      warehouse: { select: { warehouseName: true } },
      items: { include: { item: { select: { itemCode: true, itemName: true } } } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    customerId: r.customerId,
    warehouseId: r.warehouseId,
    customer: r.customer.customerName,
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
      deliveredQty: it.deliveredQty,
    })),
  };
}

export async function salesOrderPrefill(id: string) {
  const r = await prisma.salesOrder.findUnique({
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
    customerId: r.customerId,
    warehouseId: r.warehouseId,
    items: r.items
      .map((it) => ({
        itemId: it.itemId,
        itemCode: it.item.itemCode,
        itemName: it.item.itemName,
        remaining: Math.max(
          0,
          Math.round((it.qty - it.deliveredQty) * 1e6) / 1e6,
        ),
        rate: Number(it.rate),
      }))
      .filter((x) => x.remaining > 0),
  };
}

export async function createSalesOrder(input: SalesOrderFormValues) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count();
  const name = `SO-${year}-${String(count + 1).padStart(5, "0")}`;
  const { rows, totalQty, totalAmount } = buildRows(input);
  const row = await prisma.salesOrder.create({
    data: {
      name,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      remarks: input.remarks?.trim() || null,
      totalQty,
      totalAmount,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updateSalesOrder(
  id: string,
  input: SalesOrderFormValues,
) {
  validate(input);
  const so = await prisma.salesOrder.findUnique({ where: { id } });
  if (!so) throw new Error("Sales Order not found");
  if (so.status !== "DRAFT") throw new Error("Only draft orders can be edited");
  const { rows, totalQty, totalAmount } = buildRows(input);
  await prisma.$transaction([
    prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } }),
    prisma.salesOrder.update({
      where: { id },
      data: {
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
        remarks: input.remarks?.trim() || null,
        totalQty,
        totalAmount,
        items: { create: rows },
      },
    }),
  ]);
  return { id, name: so.name };
}

export async function deleteSalesOrder(id: string) {
  const so = await prisma.salesOrder.findUnique({ where: { id } });
  if (!so) throw new Error("Sales Order not found");
  if (so.status !== "DRAFT") throw new Error("Only draft orders can be deleted");
  await prisma.salesOrder.delete({ where: { id } });
}

export async function submitSalesOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new Error("Sales Order not found");
    if (so.status !== "DRAFT") throw new Error("Only draft orders can be submitted");
    for (const it of so.items)
      await adjustBinReservation(tx, {
        itemId: it.itemId,
        warehouseId: so.warehouseId,
        reservedDelta: it.qty,
      });
    await tx.salesOrder.update({
      where: { id: so.id },
      data: { status: "TO_FULFILL", submittedAt: new Date() },
    });
  });
}

export async function cancelSalesOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new Error("Sales Order not found");
    if (so.status === "DRAFT") {
      await tx.salesOrder.update({
        where: { id: so.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      return;
    }
    if (so.status !== "TO_FULFILL") throw new Error("This order can't be cancelled");
    if (so.items.some((i) => i.deliveredQty > 0))
      throw new Error("Goods already delivered against this order — cancel the delivery notes first");
    for (const it of so.items)
      await adjustBinReservation(tx, {
        itemId: it.itemId,
        warehouseId: so.warehouseId,
        reservedDelta: -(it.qty - it.deliveredQty),
      });
    await tx.salesOrder.update({
      where: { id: so.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
