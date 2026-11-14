import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";
import { adjustBinReservation } from "@/lib/bin";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  PurchaseReceiptDetail,
  PurchaseReceiptFormValues,
  PurchaseReceiptListItem,
} from "@/features/purchase-receipt/schema";

const VT = "Purchase Receipt";
const SORTABLE = ["name", "postingAt", "totalQty", "totalAmount", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type Filters = { status?: string };

function validate(input: PurchaseReceiptFormValues) {
  if (!input.supplierId) throw new Error("Select a supplier");
  if (!input.warehouseId) throw new Error("Select a warehouse to receive into");
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
}

function buildRows(input: PurchaseReceiptFormValues) {
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

export async function listPurchaseReceipts(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<PurchaseReceiptListItem>> {
  const where: Prisma.PurchaseReceiptWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.purchaseReceipt.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        supplier: { select: { supplierName: true } },
        warehouse: { select: { warehouseName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseReceipt.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      supplier: r.supplier.supplierName,
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

export async function getPurchaseReceipt(
  id: string,
): Promise<PurchaseReceiptDetail | null> {
  const r = await prisma.purchaseReceipt.findUnique({
    where: { id },
    include: {
      supplier: { select: { supplierName: true } },
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
    supplierId: r.supplierId,
    warehouseId: r.warehouseId,
    supplier: r.supplier.supplierName,
    warehouse: r.warehouse.warehouseName,
    purchaseOrderId: r.purchaseOrderId,
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    remarks: r.remarks,
    totalQty: r.totalQty,
    totalAmount: Number(r.totalAmount),
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      uom: it.uom,
      qty: it.qty,
      rate: Number(it.rate),
      amount: Number(it.amount),
    })),
  };
}

export async function createPurchaseReceipt(input: PurchaseReceiptFormValues) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.purchaseReceipt.count();
  const name = `PR-${year}-${String(count + 1).padStart(5, "0")}`;
  const { rows, totalQty, totalAmount } = buildRows(input);
  const row = await prisma.purchaseReceipt.create({
    data: {
      name,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      purchaseOrderId: input.purchaseOrderId || null,
      remarks: input.remarks?.trim() || null,
      totalQty,
      totalAmount,
      items: { create: rows },
    },
  });
  return { id: row.id, name };
}

export async function updatePurchaseReceipt(
  id: string,
  input: PurchaseReceiptFormValues,
) {
  validate(input);
  const pr = await prisma.purchaseReceipt.findUnique({ where: { id } });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "DRAFT") throw new Error("Only draft receipts can be edited");
  const { rows, totalQty, totalAmount } = buildRows(input);
  await prisma.$transaction([
    prisma.purchaseReceiptItem.deleteMany({ where: { purchaseReceiptId: id } }),
    prisma.purchaseReceipt.update({
      where: { id },
      data: {
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        purchaseOrderId: input.purchaseOrderId || null,
        remarks: input.remarks?.trim() || null,
        totalQty,
        totalAmount,
        items: { create: rows },
      },
    }),
  ]);
  return { id, name: pr.name };
}

export async function deletePurchaseReceipt(id: string) {
  const pr = await prisma.purchaseReceipt.findUnique({ where: { id } });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "DRAFT") throw new Error("Only draft receipts can be deleted");
  await prisma.purchaseReceipt.delete({ where: { id } });
}

export async function submitPurchaseReceipt(id: string) {
  const pr = await prisma.purchaseReceipt.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "DRAFT") throw new Error("Only draft receipts can be submitted");
  await prisma.$transaction(async (tx) => {
    for (const it of pr.items) {
      await postStockLedger(tx, {
        itemId: it.itemId,
        warehouseId: pr.warehouseId,
        actualQty: it.qty,
        incomingRate: Number(it.rate),
        voucherType: VT,
        voucherNo: pr.name,
        voucherDetailId: it.id,
        postingAt: pr.postingAt,
      });
    }
    if (pr.purchaseOrderId) {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: pr.purchaseOrderId },
        include: { items: true },
      });
      if (po) {
        const recv = new Map<string, number>();
        for (const it of pr.items)
          recv.set(it.itemId, (recv.get(it.itemId) ?? 0) + it.qty);
        for (const [itemId, q] of Array.from(recv.entries())) {
          const poItem = po.items.find((p) => p.itemId === itemId);
          if (!poItem) continue;
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: { increment: q } },
          });
          await adjustBinReservation(tx, {
            itemId,
            warehouseId: po.warehouseId,
            orderedDelta: -q,
          });
        }
        const fresh = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: po.id },
        });
        const done = fresh.every((i) => i.receivedQty >= i.qty - 1e-6);
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: done ? "COMPLETED" : "TO_FULFILL" },
        });
      }
    }
    await tx.purchaseReceipt.update({
      where: { id: pr.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });
}

export async function cancelPurchaseReceipt(id: string) {
  const pr = await prisma.purchaseReceipt.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!pr) throw new Error("Purchase Receipt not found");
  if (pr.status !== "SUBMITTED")
    throw new Error("Only submitted receipts can be cancelled");
  await prisma.$transaction(async (tx) => {
    const sles = await tx.stockLedgerEntry.findMany({
      where: { voucherType: VT, voucherNo: pr.name, isCancelled: false },
    });
    for (const s of sles) {
      await postStockLedger(tx, {
        itemId: s.itemId,
        warehouseId: s.warehouseId,
        actualQty: -s.actualQty,
        incomingRate: Number(s.valuationRate),
        voucherType: VT,
        voucherNo: pr.name,
        voucherDetailId: s.voucherDetailId,
        postingAt: new Date(),
      });
    }
    await tx.stockLedgerEntry.updateMany({
      where: { voucherType: VT, voucherNo: pr.name, isCancelled: false },
      data: { isCancelled: true },
    });
    if (pr.purchaseOrderId) {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: pr.purchaseOrderId },
        include: { items: true },
      });
      if (po && po.status !== "CANCELLED") {
        const recv = new Map<string, number>();
        for (const it of pr.items)
          recv.set(it.itemId, (recv.get(it.itemId) ?? 0) + it.qty);
        for (const [itemId, q] of Array.from(recv.entries())) {
          const poItem = po.items.find((p) => p.itemId === itemId);
          if (!poItem) continue;
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: { decrement: q } },
          });
          await adjustBinReservation(tx, {
            itemId,
            warehouseId: po.warehouseId,
            orderedDelta: q,
          });
        }
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "TO_FULFILL" },
        });
      }
    }
    await tx.purchaseReceipt.update({
      where: { id: pr.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
