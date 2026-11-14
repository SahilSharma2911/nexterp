"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ItemInput = {
  id?: string;
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroup?: string;
  stockUom?: string;
  isStockItem?: boolean;
  hasSerialNo?: boolean;
  hasBatchNo?: boolean;
  valuationRate?: number | null;
  disabled?: boolean;
};

export async function upsertItem(input: ItemInput) {
  if (!input.itemCode?.trim()) throw new Error("Item Code is required");
  if (!input.itemName?.trim()) throw new Error("Item Name is required");

  const data = {
    itemCode: input.itemCode.trim(),
    itemName: input.itemName.trim(),
    description: input.description?.trim() || null,
    itemGroup: input.itemGroup?.trim() || null,
    stockUom: input.stockUom?.trim() || "Nos",
    isStockItem: input.isStockItem ?? true,
    hasSerialNo: !!input.hasSerialNo,
    hasBatchNo: !!input.hasBatchNo,
    valuationRate: input.valuationRate == null ? 0 : input.valuationRate,
    disabled: !!input.disabled,
  };

  let id = input.id;
  if (id) {
    await prisma.item.update({ where: { id }, data });
  } else {
    const dupe = await prisma.item.findUnique({ where: { itemCode: data.itemCode } });
    if (dupe) throw new Error(`Item Code "${data.itemCode}" already exists`);
    const row = await prisma.item.create({ data });
    id = row.id;
  }

  revalidatePath("/stock/items");
  return { ok: true, id };
}

export async function getItems() {
  const rows = await prisma.item.findMany({ orderBy: { itemCode: "asc" } });
  return rows.map((r) => ({
    id: r.id, itemCode: r.itemCode, itemName: r.itemName, itemGroup: r.itemGroup,
    stockUom: r.stockUom, isStockItem: r.isStockItem, hasSerialNo: r.hasSerialNo,
    hasBatchNo: r.hasBatchNo, valuationRate: Number(r.valuationRate), disabled: r.disabled,
  }));
}

export async function getItem(id: string) {
  const r = await prisma.item.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id, itemCode: r.itemCode, itemName: r.itemName, description: r.description,
    itemGroup: r.itemGroup, stockUom: r.stockUom, isStockItem: r.isStockItem,
    hasSerialNo: r.hasSerialNo, hasBatchNo: r.hasBatchNo, valuationRate: Number(r.valuationRate),
    disabled: r.disabled,
  };
}

// Lightweight list for pickers.
export async function getItemOptions() {
  const rows = await prisma.item.findMany({
    where: { disabled: false, isStockItem: true },
    orderBy: { itemCode: "asc" },
    select: { id: true, itemCode: true, itemName: true, stockUom: true, valuationRate: true },
  });
  return rows.map((r) => ({ id: r.id, itemCode: r.itemCode, itemName: r.itemName, stockUom: r.stockUom, valuationRate: Number(r.valuationRate) }));
}
