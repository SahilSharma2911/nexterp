import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type { Item, ItemFormValues, ItemListItem } from "@/features/items/schema";

// Business logic for the Item master. Pure functions reused by the route
// handlers (and anything else) — no next/cache, no HTTP concerns here.

const SORTABLE = [
  "itemCode",
  "itemName",
  "itemGroup",
  "valuationRate",
  "createdAt",
] as const;

type ItemRow = Prisma.ItemGetPayload<object>;

function toListItem(r: ItemRow): ItemListItem {
  return {
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    itemGroup: r.itemGroup,
    stockUom: r.stockUom,
    isStockItem: r.isStockItem,
    valuationRate: Number(r.valuationRate),
    disabled: r.disabled,
  };
}

function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    description: r.description,
    itemGroup: r.itemGroup,
    stockUom: r.stockUom,
    isStockItem: r.isStockItem,
    hasSerialNo: r.hasSerialNo,
    hasBatchNo: r.hasBatchNo,
    valuationRate: Number(r.valuationRate),
    disabled: r.disabled,
  };
}

function toData(v: ItemFormValues) {
  return {
    itemCode: v.itemCode.trim(),
    itemName: v.itemName.trim(),
    description: v.description?.trim() || null,
    itemGroup: v.itemGroup?.trim() || null,
    stockUom: v.stockUom.trim() || "Nos",
    isStockItem: v.isStockItem,
    hasSerialNo: v.hasSerialNo,
    hasBatchNo: v.hasBatchNo,
    valuationRate: v.valuationRate ?? 0,
    disabled: v.disabled,
  };
}

export async function listItems(
  p: ListParams,
): Promise<ListResponse<ItemListItem>> {
  const where: Prisma.ItemWhereInput = p.search
    ? {
        OR: [
          { itemCode: { contains: p.search, mode: "insensitive" } },
          { itemName: { contains: p.search, mode: "insensitive" } },
          { itemGroup: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { itemCode: "asc" });

  const [rows, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.item.count({ where }),
  ]);

  return { rows: rows.map(toListItem), total, page: p.page, limit: p.limit };
}

export async function getItemById(id: string): Promise<Item | null> {
  const r = await prisma.item.findUnique({ where: { id } });
  return r ? toItem(r) : null;
}

export async function createItem(values: ItemFormValues): Promise<Item> {
  const code = values.itemCode.trim();
  const dupe = await prisma.item.findUnique({ where: { itemCode: code } });
  if (dupe) throw new Error(`Item Code "${code}" already exists`);
  const r = await prisma.item.create({ data: toData(values) });
  return toItem(r);
}

export async function updateItem(
  id: string,
  values: ItemFormValues,
): Promise<Item> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new Error("Item not found");
  const code = values.itemCode.trim();
  if (code !== existing.itemCode) {
    const dupe = await prisma.item.findUnique({ where: { itemCode: code } });
    if (dupe) throw new Error(`Item Code "${code}" already exists`);
  }
  const r = await prisma.item.update({ where: { id }, data: toData(values) });
  return toItem(r);
}

export async function deleteItem(id: string): Promise<void> {
  try {
    await prisma.item.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this item is used in transactions. Disable it instead.",
    );
  }
}
