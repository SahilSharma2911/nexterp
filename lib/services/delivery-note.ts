import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";
import { postIssueFefo } from "@/lib/batch-stock";
import { adjustBinReservation } from "@/lib/bin";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  DeliveryNoteDetail,
  DeliveryNoteFormValues,
  DeliveryNoteListItem,
} from "@/features/delivery-note/schema";

const VT = "Delivery Note";
const SORTABLE = ["name", "postingAt", "totalQty", "totalAmount", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type Filters = { status?: string };

function validate(input: DeliveryNoteFormValues) {
  if (!input.customerId) throw new Error("Select a customer");
  if (!input.warehouseId) throw new Error("Select a warehouse to ship from");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
}

function buildRows(input: DeliveryNoteFormValues) {
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

export async function listDeliveryNotes(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<DeliveryNoteListItem>> {
  const where: Prisma.DeliveryNoteWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.deliveryNote.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        customer: { select: { customerName: true } },
        warehouse: { select: { warehouseName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.deliveryNote.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      customer: r.customer.customerName,
      warehouse: r.warehouse.warehouseName,
      status: r.status,
      totalQty: r.totalQty,
      totalAmount: Number(r.totalAmount),
      itemCount: r._count.items,
      postingAt: r.postingAt.toISOString(),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getDeliveryNote(
  id: string,
): Promise<DeliveryNoteDetail | null> {
  const r = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      customer: { select: { customerName: true } },
      warehouse: { select: { warehouseName: true } },
      items: {
        include: {
          item: { select: { itemCode: true, itemName: true, stockUom: true } },
        },
      },
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
    salesOrderId: r.salesOrderId,
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    remarks: r.remarks,
    totalQty: r.totalQty,
    totalAmount: Number(r.totalAmount),
    totalCogs: Number(r.totalCogs),
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      uom: it.uom,
      qty: it.qty,
      rate: Number(it.rate),
      amount: Number(it.amount),
      valuationRate: Number(it.valuationRate),
    })),
  };
}

export async function createDeliveryNote(input: DeliveryNoteFormValues) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.deliveryNote.count();
  const name = `DN-${year}-${String(count + 1).padStart(5, "0")}`;
  const { rows, totalQty, totalAmount } = buildRows(input);
  const row = await prisma.deliveryNote.create({
    data: {
      name,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      salesOrderId: input.salesOrderId || null,
      remarks: input.remarks?.trim() || null,
      totalQty,
      totalAmount,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updateDeliveryNote(
  id: string,
  input: DeliveryNoteFormValues,
) {
  validate(input);
  const dn = await prisma.deliveryNote.findUnique({ where: { id } });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "DRAFT") throw new Error("Only draft notes can be edited");
  const { rows, totalQty, totalAmount } = buildRows(input);
  await prisma.$transaction([
    prisma.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } }),
    prisma.deliveryNote.update({
      where: { id },
      data: {
        customerId: input.customerId,
        warehouseId: input.warehouseId,
        salesOrderId: input.salesOrderId || null,
        remarks: input.remarks?.trim() || null,
        totalQty,
        totalAmount,
        items: { create: rows },
      },
    }),
  ]);
  return { id, name: dn.name };
}

export async function deleteDeliveryNote(id: string) {
  const dn = await prisma.deliveryNote.findUnique({ where: { id } });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "DRAFT") throw new Error("Only draft notes can be deleted");
  await prisma.deliveryNote.delete({ where: { id } });
}

export async function submitDeliveryNote(id: string) {
  const dn = await prisma.deliveryNote.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "DRAFT") throw new Error("Only draft notes can be submitted");
  const itemFlags = await prisma.item.findMany({
    where: { id: { in: dn.items.map((i) => i.itemId) } },
    select: { id: true, hasBatchNo: true },
  });
  const batchTracked = new Set(
    itemFlags.filter((i) => i.hasBatchNo).map((i) => i.id),
  );
  await prisma.$transaction(async (tx) => {
    let cogs = 0;
    for (const it of dn.items) {
      const res = await postIssueFefo(
        tx,
        {
          itemId: it.itemId,
          warehouseId: dn.warehouseId,
          qty: it.qty,
          voucherType: VT,
          voucherNo: dn.name,
          voucherDetailId: it.id,
          postingAt: dn.postingAt,
        },
        batchTracked.has(it.itemId),
      );
      cogs += Math.abs(res.valueDiff);
      await tx.deliveryNoteItem.update({
        where: { id: it.id },
        data: { valuationRate: res.valuationRate },
      });
    }
    if (dn.salesOrderId) {
      const so = await tx.salesOrder.findUnique({
        where: { id: dn.salesOrderId },
        include: { items: true },
      });
      if (so) {
        const del = new Map<string, number>();
        for (const it of dn.items)
          del.set(it.itemId, (del.get(it.itemId) ?? 0) + it.qty);
        for (const [itemId, q] of Array.from(del.entries())) {
          const soItem = so.items.find((p) => p.itemId === itemId);
          if (!soItem) continue;
          await tx.salesOrderItem.update({
            where: { id: soItem.id },
            data: { deliveredQty: { increment: q } },
          });
          await adjustBinReservation(tx, {
            itemId,
            warehouseId: so.warehouseId,
            reservedDelta: -q,
          });
        }
        const fresh = await tx.salesOrderItem.findMany({
          where: { salesOrderId: so.id },
        });
        const done = fresh.every((i) => i.deliveredQty >= i.qty - 1e-6);
        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: done ? "COMPLETED" : "TO_FULFILL" },
        });
      }
    }
    await tx.deliveryNote.update({
      where: { id: dn.id },
      data: { status: "SUBMITTED", submittedAt: new Date(), totalCogs: round2(cogs) },
    });
  });
}

export async function cancelDeliveryNote(id: string) {
  const dn = await prisma.deliveryNote.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!dn) throw new Error("Delivery Note not found");
  if (dn.status !== "SUBMITTED")
    throw new Error("Only submitted notes can be cancelled");
  await prisma.$transaction(async (tx) => {
    const sles = await tx.stockLedgerEntry.findMany({
      where: { voucherType: VT, voucherNo: dn.name, isCancelled: false },
    });
    for (const s of sles) {
      await postStockLedger(tx, {
        itemId: s.itemId,
        warehouseId: s.warehouseId,
        actualQty: -s.actualQty,
        incomingRate: Number(s.valuationRate),
        voucherType: VT,
        voucherNo: dn.name,
        voucherDetailId: s.voucherDetailId,
        postingAt: new Date(),
        batchId: s.batchId,
      });
    }
    await tx.stockLedgerEntry.updateMany({
      where: { voucherType: VT, voucherNo: dn.name, isCancelled: false },
      data: { isCancelled: true },
    });
    if (dn.salesOrderId) {
      const so = await tx.salesOrder.findUnique({
        where: { id: dn.salesOrderId },
        include: { items: true },
      });
      if (so && so.status !== "CANCELLED") {
        const del = new Map<string, number>();
        for (const it of dn.items)
          del.set(it.itemId, (del.get(it.itemId) ?? 0) + it.qty);
        for (const [itemId, q] of Array.from(del.entries())) {
          const soItem = so.items.find((p) => p.itemId === itemId);
          if (!soItem) continue;
          await tx.salesOrderItem.update({
            where: { id: soItem.id },
            data: { deliveredQty: { decrement: q } },
          });
          await adjustBinReservation(tx, {
            itemId,
            warehouseId: so.warehouseId,
            reservedDelta: q,
          });
        }
        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: "TO_FULFILL" },
        });
      }
    }
    await tx.deliveryNote.update({
      where: { id: dn.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
