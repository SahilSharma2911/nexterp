import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import {
  purposeNeeds,
  type StockEntryDetail,
  type StockEntryFormValues,
  type StockEntryListItem,
  type StockEntryPurpose,
} from "@/features/stock-entry/schema";

const VOUCHER_TYPE = "Stock Entry";
const SORTABLE = ["name", "postingAt", "status", "valueDifference", "createdAt"] as const;

type Filters = { status?: string; purpose?: string };

function validate(input: StockEntryFormValues) {
  if (!input.items?.length) throw new Error("Add at least one item");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Quantity must be positive");
  }
  const needs = purposeNeeds(input.purpose);
  if (needs.from && !input.fromWarehouseId)
    throw new Error("Source warehouse is required");
  if (needs.to && !input.toWarehouseId)
    throw new Error("Target warehouse is required");
  if (
    input.purpose === "MATERIAL_TRANSFER" &&
    input.fromWarehouseId === input.toWarehouseId
  )
    throw new Error("Source and target must differ");
  if (needs.finished && !input.items.some((i) => i.isFinishedItem))
    throw new Error("Mark at least one row as the finished item");
}

function itemsCreate(input: StockEntryFormValues) {
  return input.items.map((it) => ({
    itemId: it.itemId,
    qty: Number(it.qty),
    basicRate: it.basicRate == null ? 0 : Number(it.basicRate),
    amount: it.basicRate ? Number(it.qty) * Number(it.basicRate) : 0,
    isFinishedItem: !!it.isFinishedItem,
    note: it.note?.trim() || null,
  }));
}

export async function listStockEntries(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<StockEntryListItem>> {
  const where: Prisma.StockEntryWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.purpose ? { purpose: filters.purpose as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.stockEntry.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        fromWarehouse: { select: { warehouseName: true } },
        toWarehouse: { select: { warehouseName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.stockEntry.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      purpose: r.purpose as StockEntryPurpose,
      status: r.status,
      postingAt: r.postingAt.toISOString(),
      fromWarehouse: r.fromWarehouse?.warehouseName ?? null,
      toWarehouse: r.toWarehouse?.warehouseName ?? null,
      itemCount: r._count.items,
      valueDifference: Number(r.valueDifference),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getStockEntry(
  id: string,
): Promise<StockEntryDetail | null> {
  const r = await prisma.stockEntry.findUnique({
    where: { id },
    include: {
      fromWarehouse: { select: { warehouseName: true } },
      toWarehouse: { select: { warehouseName: true } },
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
    purpose: r.purpose as StockEntryPurpose,
    status: r.status,
    postingAt: r.postingAt.toISOString(),
    fromWarehouseId: r.fromWarehouseId,
    toWarehouseId: r.toWarehouseId,
    fromWarehouse: r.fromWarehouse?.warehouseName ?? null,
    toWarehouse: r.toWarehouse?.warehouseName ?? null,
    remarks: r.remarks,
    totalIncomingValue: Number(r.totalIncomingValue),
    totalOutgoingValue: Number(r.totalOutgoingValue),
    valueDifference: Number(r.valueDifference),
    items: r.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.itemCode,
      itemName: it.item.itemName,
      qty: it.qty,
      uom: it.uom,
      basicRate: Number(it.basicRate),
      valuationRate: Number(it.valuationRate),
      amount: Number(it.amount),
      isFinishedItem: it.isFinishedItem,
      note: it.note,
    })),
  };
}

export async function createStockEntry(input: StockEntryFormValues) {
  validate(input);
  const year = new Date().getFullYear();
  const count = await prisma.stockEntry.count();
  const name = `SE-${year}-${String(count + 1).padStart(5, "0")}`;

  const row = await prisma.stockEntry.create({
    data: {
      name,
      purpose: input.purpose,
      status: "DRAFT",
      fromWarehouseId: input.fromWarehouseId || null,
      toWarehouseId: input.toWarehouseId || null,
      remarks: input.remarks?.trim() || null,
      items: { create: itemsCreate(input) },
    },
  });
  return { id: row.id, name };
}

export async function updateStockEntry(
  id: string,
  input: StockEntryFormValues,
) {
  validate(input);
  const entry = await prisma.stockEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Stock Entry not found");
  if (entry.status !== "DRAFT")
    throw new Error("Only draft entries can be edited");

  await prisma.$transaction(async (tx) => {
    await tx.stockEntryDetail.deleteMany({ where: { stockEntryId: id } });
    await tx.stockEntry.update({
      where: { id },
      data: {
        purpose: input.purpose,
        fromWarehouseId: input.fromWarehouseId || null,
        toWarehouseId: input.toWarehouseId || null,
        remarks: input.remarks?.trim() || null,
        items: { create: itemsCreate(input) },
      },
    });
  });
  return { id, name: entry.name };
}

export async function deleteStockEntry(id: string) {
  const entry = await prisma.stockEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Stock Entry not found");
  if (entry.status !== "DRAFT")
    throw new Error("Only draft entries can be deleted");
  await prisma.stockEntry.delete({ where: { id } });
}

export async function submitStockEntry(id: string) {
  const entry = await prisma.stockEntry.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!entry) throw new Error("Stock Entry not found");
  if (entry.status !== "DRAFT")
    throw new Error("Only draft entries can be submitted");
  const purpose = entry.purpose as StockEntryPurpose;
  const postingAt = entry.postingAt;
  const from = entry.fromWarehouseId;
  const to = entry.toWarehouseId;

  await prisma.$transaction(async (tx) => {
    let incoming = 0;
    let outgoing = 0;

    const receive = async (
      itemId: string,
      warehouseId: string,
      qty: number,
      rate: number,
      detailId: string,
    ) => {
      const res = await postStockLedger(tx, {
        itemId,
        warehouseId,
        actualQty: qty,
        incomingRate: rate,
        voucherType: VOUCHER_TYPE,
        voucherNo: entry.name,
        voucherDetailId: detailId,
        postingAt,
      });
      incoming += Math.abs(res.stockValueDifference);
      await tx.stockEntryDetail.update({
        where: { id: detailId },
        data: {
          valuationRate: res.valuationRate,
          amount: Math.abs(res.stockValueDifference),
        },
      });
    };
    const issue = async (
      itemId: string,
      warehouseId: string,
      qty: number,
      detailId: string,
    ) => {
      const res = await postStockLedger(tx, {
        itemId,
        warehouseId,
        actualQty: -qty,
        voucherType: VOUCHER_TYPE,
        voucherNo: entry.name,
        voucherDetailId: detailId,
        postingAt,
      });
      outgoing += Math.abs(res.stockValueDifference);
      await tx.stockEntryDetail.update({
        where: { id: detailId },
        data: {
          valuationRate: res.valuationRate,
          amount: Math.abs(res.stockValueDifference),
        },
      });
    };

    if (purpose === "MATERIAL_RECEIPT") {
      for (const r of entry.items)
        await receive(r.itemId, to!, r.qty, Number(r.basicRate), r.id);
    } else if (purpose === "MATERIAL_ISSUE") {
      for (const r of entry.items) await issue(r.itemId, from!, r.qty, r.id);
    } else if (purpose === "MATERIAL_TRANSFER") {
      for (const r of entry.items) {
        const srcBin = await tx.bin.findUnique({
          where: {
            itemId_warehouseId: { itemId: r.itemId, warehouseId: from! },
          },
        });
        const srcRate = srcBin
          ? Number(srcBin.valuationRate)
          : Number(r.basicRate);
        await issue(r.itemId, from!, r.qty, r.id);
        await postStockLedger(tx, {
          itemId: r.itemId,
          warehouseId: to!,
          actualQty: r.qty,
          incomingRate: srcRate,
          voucherType: VOUCHER_TYPE,
          voucherNo: entry.name,
          voucherDetailId: r.id,
          postingAt,
        });
      }
    } else {
      // MANUFACTURE / REPACK: consume raw, produce finished.
      let consumed = 0;
      for (const r of entry.items.filter((i) => !i.isFinishedItem)) {
        const res = await postStockLedger(tx, {
          itemId: r.itemId,
          warehouseId: from!,
          actualQty: -r.qty,
          voucherType: VOUCHER_TYPE,
          voucherNo: entry.name,
          voucherDetailId: r.id,
          postingAt,
        });
        consumed += Math.abs(res.stockValueDifference);
        outgoing += Math.abs(res.stockValueDifference);
        await tx.stockEntryDetail.update({
          where: { id: r.id },
          data: {
            valuationRate: res.valuationRate,
            amount: Math.abs(res.stockValueDifference),
          },
        });
      }
      const finished = entry.items.filter((i) => i.isFinishedItem);
      const finishedQty = finished.reduce((s, r) => s + r.qty, 0) || 1;
      for (const r of finished) {
        const rate =
          Number(r.basicRate) > 0 ? Number(r.basicRate) : consumed / finishedQty;
        await receive(r.itemId, to!, r.qty, rate, r.id);
      }
    }

    await tx.stockEntry.update({
      where: { id: entry.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        totalIncomingValue: incoming,
        totalOutgoingValue: outgoing,
        valueDifference: incoming - outgoing,
      },
    });
  });
}

export async function cancelStockEntry(id: string) {
  const entry = await prisma.stockEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Stock Entry not found");
  if (entry.status !== "SUBMITTED")
    throw new Error("Only submitted entries can be cancelled");

  await prisma.$transaction(async (tx) => {
    const sles = await tx.stockLedgerEntry.findMany({
      where: {
        voucherType: VOUCHER_TYPE,
        voucherNo: entry.name,
        isCancelled: false,
      },
    });
    for (const s of sles) {
      await postStockLedger(tx, {
        itemId: s.itemId,
        warehouseId: s.warehouseId,
        actualQty: -s.actualQty,
        incomingRate: Number(s.valuationRate),
        voucherType: VOUCHER_TYPE,
        voucherNo: entry.name,
        voucherDetailId: s.voucherDetailId,
        postingAt: new Date(),
      });
    }
    await tx.stockLedgerEntry.updateMany({
      where: {
        voucherType: VOUCHER_TYPE,
        voucherNo: entry.name,
        isCancelled: false,
      },
      data: { isCancelled: true },
    });
    await tx.stockEntry.update({
      where: { id: entry.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
