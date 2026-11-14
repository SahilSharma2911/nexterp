"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { setStockBalance } from "@/lib/stock-ledger";

const VOUCHER_TYPE = "Stock Reconciliation";

export type ReconItemInput = { itemId: string; warehouseId: string; qty: number; valuationRate?: number | null };
export type ReconInput = { remarks?: string; items: ReconItemInput[] };

export async function createStockReconciliation(input: ReconInput) {
  if (!input.items?.length) throw new Error("Add at least one row");
  for (const it of input.items) {
    if (!it.itemId || !it.warehouseId) throw new Error("Every row needs an item and a warehouse");
    if (!(Number(it.qty) >= 0)) throw new Error("Counted quantity can't be negative");
  }
  const year = new Date().getFullYear();
  const count = await prisma.stockReconciliation.count();
  const name = `SR-${year}-${String(count + 1).padStart(5, "0")}`;

  const row = await prisma.stockReconciliation.create({
    data: {
      name, status: "DRAFT", remarks: input.remarks?.trim() || null,
      items: {
        create: input.items.map((it) => ({
          itemId: it.itemId, warehouseId: it.warehouseId, qty: Number(it.qty),
          valuationRate: it.valuationRate == null ? 0 : Number(it.valuationRate),
        })),
      },
    },
  });
  revalidatePath("/stock/reconciliation");
  return { ok: true, id: row.id, name };
}

export async function submitStockReconciliation(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const rec = await tx.stockReconciliation.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!rec) throw new Error("Stock Reconciliation not found");
    if (rec.status !== "DRAFT") throw new Error("Only draft reconciliations can be submitted");

    for (const it of rec.items) {
      const bin = await tx.bin.findUnique({ where: { itemId_warehouseId: { itemId: it.itemId, warehouseId: it.warehouseId } } });
      const currentQty = bin?.actualQty ?? 0;
      const currentRate = bin ? Number(bin.valuationRate) : 0;
      const targetRate = Number(it.valuationRate) > 0 ? Number(it.valuationRate) : currentRate;
      await setStockBalance(tx, {
        itemId: it.itemId, warehouseId: it.warehouseId, qty: it.qty, rate: targetRate,
        voucherType: VOUCHER_TYPE, voucherNo: rec.name, voucherDetailId: it.id, postingAt: rec.postingAt,
      });
      await tx.stockReconciliationItem.update({ where: { id: it.id }, data: { currentQty, currentRate } });
    }
    await tx.stockReconciliation.update({ where: { id: rec.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
  });
  revalidatePath("/stock/reconciliation");
  revalidatePath(`/stock/reconciliation/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

export async function cancelStockReconciliation(input: { id: string }) {
  await prisma.$transaction(async (tx) => {
    const rec = await tx.stockReconciliation.findUnique({ where: { id: input.id }, include: { items: true } });
    if (!rec) throw new Error("Stock Reconciliation not found");
    if (rec.status !== "SUBMITTED") throw new Error("Only submitted reconciliations can be cancelled");

    // Mark the original entries cancelled, then restore each bin to its snapshot.
    await tx.stockLedgerEntry.updateMany({ where: { voucherType: VOUCHER_TYPE, voucherNo: rec.name, isCancelled: false }, data: { isCancelled: true } });
    for (const it of rec.items) {
      await setStockBalance(tx, {
        itemId: it.itemId, warehouseId: it.warehouseId, qty: it.currentQty, rate: Number(it.currentRate),
        voucherType: VOUCHER_TYPE, voucherNo: rec.name, voucherDetailId: it.id, postingAt: new Date(),
      });
    }
    await tx.stockReconciliation.update({ where: { id: rec.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
  revalidatePath("/stock/reconciliation");
  revalidatePath(`/stock/reconciliation/${input.id}`);
  revalidatePath("/stock/ledger");
  revalidatePath("/stock/balance");
  return { ok: true };
}

/* ---- getters ---- */

export async function getStockReconciliations() {
  const rows = await prisma.stockReconciliation.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, status: r.status, postingAt: r.postingAt.toISOString(), itemCount: r._count.items }));
}

export async function getStockReconciliation(id: string) {
  const r = await prisma.stockReconciliation.findUnique({
    where: { id },
    include: { items: { include: { item: { select: { itemCode: true, itemName: true, stockUom: true } }, warehouse: { select: { warehouseName: true } } } } },
  });
  if (!r) return null;
  return {
    id: r.id, name: r.name, status: r.status, postingAt: r.postingAt.toISOString(), remarks: r.remarks,
    items: r.items.map((it) => ({
      id: it.id, itemCode: it.item.itemCode, itemName: it.item.itemName, uom: it.item.stockUom, warehouse: it.warehouse.warehouseName,
      qty: it.qty, valuationRate: Number(it.valuationRate), currentQty: it.currentQty,
      diff: r.status === "DRAFT" ? null : Math.round((it.qty - it.currentQty) * 1e6) / 1e6,
    })),
  };
}
