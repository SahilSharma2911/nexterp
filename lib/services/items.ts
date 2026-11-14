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
  "brand",
  "valuationRate",
  "createdAt",
] as const;

const itemInclude = {
  specifications: { orderBy: { sortOrder: "asc" } },
  variantAttributes: { orderBy: { sortOrder: "asc" } },
  variantOf: { select: { itemCode: true, itemName: true } },
  variants: {
    orderBy: { itemCode: "asc" },
    select: { id: true, itemCode: true, itemName: true },
  },
} satisfies Prisma.ItemInclude;

type ItemRow = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

function toListItem(r: Prisma.ItemGetPayload<object>): ItemListItem {
  return {
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    itemGroup: r.itemGroup,
    brand: r.brand,
    stockUom: r.stockUom,
    isStockItem: r.isStockItem,
    valuationRate: Number(r.valuationRate),
    disabled: r.disabled,
    hasVariants: r.hasVariants,
    isVariant: r.variantOfId != null,
  };
}

function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    description: r.description,
    itemGroup: r.itemGroup,
    brand: r.brand,
    barcode: r.barcode,
    taxCode: r.taxCode,
    stockUom: r.stockUom,
    isStockItem: r.isStockItem,
    hasSerialNo: r.hasSerialNo,
    hasBatchNo: r.hasBatchNo,
    valuationRate: Number(r.valuationRate),
    salesRate: Number(r.salesRate),
    reorderLevel: r.reorderLevel,
    disabled: r.disabled,
    hasVariants: r.hasVariants,
    variantOfId: r.variantOfId,
    variantOfCode: r.variantOf?.itemCode ?? null,
    variantOfName: r.variantOf?.itemName ?? null,
    specifications: r.specifications.map((s) => ({
      label: s.label,
      value: s.value,
    })),
    variantAttributes: r.variantAttributes.map((a) => ({
      attribute: a.attribute,
      values: a.values,
    })),
    variants: r.variants.map((v) => ({
      id: v.id,
      itemCode: v.itemCode,
      itemName: v.itemName,
    })),
  };
}

// Scalar columns only (child rows handled separately).
function toScalarData(v: ItemFormValues) {
  return {
    itemCode: v.itemCode.trim(),
    itemName: v.itemName.trim(),
    description: v.description?.trim() || null,
    itemGroup: v.itemGroup?.trim() || null,
    brand: v.brand?.trim() || null,
    barcode: v.barcode?.trim() || null,
    taxCode: v.taxCode?.trim() || null,
    stockUom: v.stockUom.trim() || "Nos",
    isStockItem: v.isStockItem,
    hasSerialNo: v.hasSerialNo,
    hasBatchNo: v.hasBatchNo,
    valuationRate: v.valuationRate ?? 0,
    salesRate: v.salesRate ?? 0,
    reorderLevel: v.reorderLevel ?? 0,
    disabled: v.disabled,
    hasVariants: v.hasVariants,
  };
}

function specCreate(v: ItemFormValues) {
  return v.specifications
    .filter((s) => s.label.trim())
    .map((s, i) => ({
      label: s.label.trim(),
      value: s.value.trim(),
      sortOrder: i,
    }));
}

function variantAttrCreate(v: ItemFormValues) {
  if (!v.hasVariants) return [];
  return v.variantAttributes
    .filter((a) => a.attribute.trim() && a.values.trim())
    .map((a, i) => ({
      attribute: a.attribute.trim(),
      values: a.values.trim(),
      sortOrder: i,
    }));
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
          { brand: { contains: p.search, mode: "insensitive" } },
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

export async function itemOptions() {
  const rows = await prisma.item.findMany({
    where: { disabled: false, isStockItem: true, hasVariants: false },
    orderBy: { itemCode: "asc" },
    select: {
      id: true,
      itemCode: true,
      itemName: true,
      stockUom: true,
      valuationRate: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    stockUom: r.stockUom,
    valuationRate: Number(r.valuationRate),
  }));
}

export async function getItemById(id: string): Promise<Item | null> {
  const r = await prisma.item.findUnique({ where: { id }, include: itemInclude });
  return r ? toItem(r) : null;
}

export async function createItem(values: ItemFormValues): Promise<Item> {
  const code = values.itemCode.trim();
  const dupe = await prisma.item.findUnique({ where: { itemCode: code } });
  if (dupe) throw new Error(`Item Code "${code}" already exists`);
  const r = await prisma.item.create({
    data: {
      ...toScalarData(values),
      specifications: { create: specCreate(values) },
      variantAttributes: { create: variantAttrCreate(values) },
    },
    include: itemInclude,
  });
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
  const r = await prisma.$transaction(async (tx) => {
    await tx.itemSpecification.deleteMany({ where: { itemId: id } });
    await tx.itemVariantAttribute.deleteMany({ where: { itemId: id } });
    return tx.item.update({
      where: { id },
      data: {
        ...toScalarData(values),
        specifications: { create: specCreate(values) },
        variantAttributes: { create: variantAttrCreate(values) },
      },
      include: itemInclude,
    });
  });
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

const slug = (s: string) =>
  s
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Cartesian product of the template's variant attributes.
function cartesian(lists: string[][]): string[][] {
  return lists.reduce<string[][]>(
    (acc, list) => acc.flatMap((combo) => list.map((v) => [...combo, v])),
    [[]],
  );
}

export async function generateVariants(
  templateId: string,
): Promise<{ created: number; skipped: number }> {
  const template = await prisma.item.findUnique({
    where: { id: templateId },
    include: { variantAttributes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) throw new Error("Item not found");
  if (!template.hasVariants)
    throw new Error("This item is not a variant template");
  const attrs = template.variantAttributes
    .map((a) => ({
      attribute: a.attribute.trim(),
      values: a.values
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((a) => a.attribute && a.values.length);
  if (!attrs.length)
    throw new Error("Add at least one variant attribute with values first");

  const combos = cartesian(attrs.map((a) => a.values));
  let created = 0;
  let skipped = 0;

  for (const combo of combos) {
    const suffix = combo.map(slug).join("-");
    const itemCode = `${template.itemCode}-${suffix}`;
    const exists = await prisma.item.findUnique({ where: { itemCode } });
    if (exists) {
      skipped++;
      continue;
    }
    const labelPairs = attrs.map((a, i) => ({
      label: a.attribute,
      value: combo[i],
      sortOrder: i,
    }));
    await prisma.item.create({
      data: {
        itemCode,
        itemName: `${template.itemName} (${combo.join(", ")})`,
        description: template.description,
        itemGroup: template.itemGroup,
        brand: template.brand,
        taxCode: template.taxCode,
        stockUom: template.stockUom,
        isStockItem: true,
        hasSerialNo: template.hasSerialNo,
        hasBatchNo: template.hasBatchNo,
        valuationRate: template.valuationRate,
        salesRate: template.salesRate,
        reorderLevel: template.reorderLevel,
        hasVariants: false,
        variantOfId: template.id,
        specifications: { create: labelPairs },
      },
    });
    created++;
  }

  return { created, skipped };
}
