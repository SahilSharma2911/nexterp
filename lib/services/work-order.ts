import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  WorkOrderDetail,
  WorkOrderFormValues,
  WorkOrderListItem,
  WorkOrderStatus,
} from "@/features/work-order/schema";

const SORTABLE = ["name", "qty", "producedQty", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round6 = (n: number) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;

type Filters = { status?: string };

export async function listWorkOrders(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<WorkOrderListItem>> {
  const where: Prisma.WorkOrderWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        productionItem: { select: { itemCode: true, itemName: true } },
        bom: { select: { name: true } },
      },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    rows: rows.map((w) => ({
      id: w.id,
      name: w.name,
      itemCode: w.productionItem.itemCode,
      itemName: w.productionItem.itemName,
      bomName: w.bom.name,
      qty: w.qty,
      producedQty: w.producedQty,
      status: w.status as WorkOrderStatus,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getWorkOrder(id: string): Promise<WorkOrderDetail | null> {
  const w = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      productionItem: { select: { itemCode: true, itemName: true, stockUom: true } },
      bom: { select: { name: true } },
      sourceWarehouse: { select: { warehouseName: true } },
      fgWarehouse: { select: { warehouseName: true } },
      items: { include: { item: { select: { itemCode: true, itemName: true } } } },
      stockEntries: { select: { id: true, name: true, status: true } },
    },
  });
  if (!w) return null;
  return {
    id: w.id,
    name: w.name,
    itemCode: w.productionItem.itemCode,
    itemName: w.productionItem.itemName,
    uom: w.productionItem.stockUom,
    bomName: w.bom.name,
    qty: w.qty,
    producedQty: w.producedQty,
    status: w.status as WorkOrderStatus,
    useMultiLevelBom: w.useMultiLevelBom,
    sourceWarehouse: w.sourceWarehouse?.warehouseName ?? null,
    fgWarehouse: w.fgWarehouse?.warehouseName ?? null,
    remarks: w.remarks,
    items: w.items.map((i) => ({
      id: i.id,
      itemCode: i.item.itemCode,
      itemName: i.item.itemName,
      requiredQty: i.requiredQty,
      consumedQty: i.consumedQty,
      rate: Number(i.rate),
    })),
    stockEntries: w.stockEntries,
  };
}

export async function createWorkOrder(input: WorkOrderFormValues) {
  if (!input.bomId) throw new Error("Select a BOM");
  const qty = Number(input.qty);
  if (!(qty > 0)) throw new Error("Quantity to manufacture must be positive");

  const bom = await prisma.bom.findUnique({
    where: { id: input.bomId },
    include: { items: true, explosionItems: true },
  });
  if (!bom) throw new Error("BOM not found");
  if (bom.status !== "SUBMITTED" || !bom.isActive)
    throw new Error("Work Orders need an active, submitted BOM");

  const multiLevel = input.useMultiLevelBom ?? true;
  const source =
    multiLevel && bom.explosionItems.length ? bom.explosionItems : bom.items;
  const factor = qty / (bom.quantity || 1);
  const required = source.map((i) => ({
    itemId: i.itemId,
    requiredQty: round6(i.qty * factor),
    rate: Number(i.rate),
  }));

  const year = new Date().getFullYear();
  const count = await prisma.workOrder.count();
  const name = `WO-${year}-${String(count + 1).padStart(5, "0")}`;

  const wo = await prisma.workOrder.create({
    data: {
      name,
      productionItemId: bom.itemId,
      bomId: bom.id,
      qty,
      useMultiLevelBom: multiLevel,
      status: "NOT_STARTED",
      sourceWarehouseId: input.sourceWarehouseId || null,
      fgWarehouseId: input.fgWarehouseId || null,
      remarks: input.remarks?.trim() || null,
      items: { create: required },
    },
  });
  return { id: wo.id, name };
}

export async function finishWorkOrder(id: string, finishQty?: number) {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!wo) throw new Error("Work Order not found");
  if (wo.status === "COMPLETED") throw new Error("Work Order is already completed");
  if (wo.status === "CANCELLED") throw new Error("Work Order is cancelled");
  if (!wo.sourceWarehouseId || !wo.fgWarehouseId)
    throw new Error("Set source and finished-goods warehouses on the Work Order first");

  const remaining = round6(wo.qty - wo.producedQty);
  const produceQty = finishQty != null ? Number(finishQty) : remaining;
  if (!(produceQty > 0)) throw new Error("Nothing left to produce");
  if (produceQty > remaining + 1e-6)
    throw new Error(`Only ${remaining} left to produce`);

  const ratio = produceQty / wo.qty;
  const postingAt = new Date();

  await prisma.$transaction(async (tx) => {
    const count = await tx.stockEntry.count();
    const seName = `SE-${postingAt.getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const se = await tx.stockEntry.create({
      data: {
        name: seName,
        purpose: "MANUFACTURE",
        status: "SUBMITTED",
        submittedAt: postingAt,
        workOrderId: wo.id,
        fromWarehouseId: wo.sourceWarehouseId,
        toWarehouseId: wo.fgWarehouseId,
      },
    });

    let consumedValue = 0;
    for (const it of wo.items) {
      const consume = round6(it.requiredQty * ratio);
      if (consume <= 0) continue;
      const res = await postStockLedger(tx, {
        itemId: it.itemId,
        warehouseId: wo.sourceWarehouseId!,
        actualQty: -consume,
        voucherType: "Stock Entry",
        voucherNo: seName,
        postingAt,
      });
      consumedValue += Math.abs(res.stockValueDifference);
      await tx.stockEntryDetail.create({
        data: {
          stockEntryId: se.id,
          itemId: it.itemId,
          sWarehouseId: wo.sourceWarehouseId,
          qty: consume,
          valuationRate: res.valuationRate,
          amount: round2(Math.abs(res.stockValueDifference)),
        },
      });
      await tx.workOrderItem.update({
        where: { id: it.id },
        data: { consumedQty: { increment: consume } },
      });
    }

    const fgRate = round6(consumedValue / produceQty);
    await postStockLedger(tx, {
      itemId: wo.productionItemId,
      warehouseId: wo.fgWarehouseId!,
      actualQty: produceQty,
      incomingRate: fgRate,
      voucherType: "Stock Entry",
      voucherNo: seName,
      postingAt,
    });
    await tx.stockEntryDetail.create({
      data: {
        stockEntryId: se.id,
        itemId: wo.productionItemId,
        tWarehouseId: wo.fgWarehouseId,
        qty: produceQty,
        basicRate: fgRate,
        valuationRate: fgRate,
        amount: round2(consumedValue),
        isFinishedItem: true,
      },
    });
    await tx.stockEntry.update({
      where: { id: se.id },
      data: {
        totalOutgoingValue: round2(consumedValue),
        totalIncomingValue: round2(consumedValue),
        valueDifference: 0,
      },
    });

    const newProduced = round6(wo.producedQty + produceQty);
    await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        producedQty: newProduced,
        status: newProduced >= wo.qty - 1e-6 ? "COMPLETED" : "IN_PROCESS",
      },
    });
  });
}

export async function cancelWorkOrder(id: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) throw new Error("Work Order not found");
  if (wo.producedQty > 0)
    throw new Error(
      "Can't cancel — units already produced. Reverse the stock entries first.",
    );
  if (wo.status === "CANCELLED") throw new Error("Already cancelled");
  await prisma.workOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
