import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Item,
  ItemAnalytics,
  ItemFormValues,
  ItemListItem,
} from "@/features/items/schema";

// Management insights for the Items list header.
export async function itemAnalytics(): Promise<ItemAnalytics> {
  const [total, stockItems, grouped, stockVal, reorderItems, binSums] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { isStockItem: true, disabled: false } }),
      prisma.item.groupBy({
        by: ["itemGroup"],
        _count: true,
        where: { disabled: false },
      }),
      prisma.bin.aggregate({ _sum: { stockValue: true } }),
      prisma.item.findMany({
        where: { reorderLevel: { gt: 0 }, disabled: false },
        select: { id: true, reorderLevel: true },
      }),
      prisma.bin.groupBy({ by: ["itemId"], _sum: { actualQty: true } }),
    ]);

  const onHand = new Map(
    binSums.map((b) => [b.itemId, b._sum.actualQty ?? 0]),
  );
  const lowStock = reorderItems.filter(
    (it) => (onHand.get(it.id) ?? 0) < it.reorderLevel,
  ).length;

  const byGroup = grouped
    .map((g) => ({ name: g.itemGroup ?? "Ungrouped", value: g._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    total,
    stockItems,
    lowStock,
    stockValue: Number(stockVal._sum.stockValue ?? 0),
    byGroup,
  };
}

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
    imageUrl: r.imageUrl,
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
    rack: r.rack,
    stockUom: r.stockUom,
    isStockItem: r.isStockItem,
    hasSerialNo: r.hasSerialNo,
    hasBatchNo: r.hasBatchNo,
    valuationRate: Number(r.valuationRate),
    salesRate: Number(r.salesRate),
    reorderLevel: r.reorderLevel,
    imageUrl: r.imageUrl,
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
    rack: v.rack?.trim() || null,
    stockUom: v.stockUom.trim() || "Nos",
    isStockItem: v.isStockItem,
    hasSerialNo: v.hasSerialNo,
    hasBatchNo: v.hasBatchNo,
    valuationRate: v.valuationRate ?? 0,
    salesRate: v.salesRate ?? 0,
    reorderLevel: v.reorderLevel ?? 0,
    imageUrl: v.imageUrl?.trim() || null,
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
  filters: { group?: string } = {},
): Promise<ListResponse<ItemListItem>> {
  const and: Prisma.ItemWhereInput[] = [];
  if (p.search)
    and.push({
      OR: [
        { itemCode: { contains: p.search, mode: "insensitive" } },
        { itemName: { contains: p.search, mode: "insensitive" } },
        { itemGroup: { contains: p.search, mode: "insensitive" } },
        { brand: { contains: p.search, mode: "insensitive" } },
        { barcode: { contains: p.search, mode: "insensitive" } },
        { rack: { contains: p.search, mode: "insensitive" } },
      ],
    });
  if (filters.group)
    and.push({ itemGroup: { equals: filters.group, mode: "insensitive" } });
  const where: Prisma.ItemWhereInput = and.length ? { AND: and } : {};
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
      barcode: true,
      hasBatchNo: true,
      hasSerialNo: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    itemCode: r.itemCode,
    itemName: r.itemName,
    stockUom: r.stockUom,
    valuationRate: Number(r.valuationRate),
    barcode: r.barcode,
    hasBatchNo: r.hasBatchNo,
    hasSerialNo: r.hasSerialNo,
  }));
}

// Barcode (or item-code) lookup — powers the scan-to-add flows across the app.
export async function itemByBarcode(code: string) {
  const c = code.trim();
  if (!c) return null;
  const r = await prisma.item.findFirst({
    where: {
      disabled: false,
      OR: [{ barcode: c }, { itemCode: { equals: c, mode: "insensitive" } }],
    },
    select: {
      id: true,
      itemCode: true,
      itemName: true,
      stockUom: true,
      valuationRate: true,
      barcode: true,
    },
  });
  return r
    ? {
        id: r.id,
        itemCode: r.itemCode,
        itemName: r.itemName,
        stockUom: r.stockUom,
        valuationRate: Number(r.valuationRate),
        barcode: r.barcode,
      }
    : null;
}

export async function getItemById(id: string): Promise<Item | null> {
  const r = await prisma.item.findUnique({ where: { id }, include: itemInclude });
  return r ? toItem(r) : null;
}

// Next free auto SKU like ITEM-00042 (used when no code is given).
async function nextItemCode(): Promise<string> {
  let n = (await prisma.item.count()) + 1;
  for (let i = 0; i < 100000; i++) {
    const code = `ITEM-${String(n).padStart(5, "0")}`;
    const exists = await prisma.item.findUnique({ where: { itemCode: code } });
    if (!exists) return code;
    n++;
  }
  throw new Error("Could not allocate an item code");
}

export async function createItem(values: ItemFormValues): Promise<Item> {
  let code = values.itemCode.trim();
  if (!code) {
    code = await nextItemCode();
  } else {
    const dupe = await prisma.item.findUnique({ where: { itemCode: code } });
    if (dupe) throw new Error(`Item Code "${code}" already exists`);
  }
  const r = await prisma.item.create({
    data: {
      ...toScalarData(values),
      itemCode: code,
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
  // Blank keeps the existing code (don't wipe it on edit).
  const code = values.itemCode.trim() || existing.itemCode;
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
        itemCode: code,
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
