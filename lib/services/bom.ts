import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  BomDetail,
  BomFormValues,
  BomListItem,
  BomOption,
} from "@/features/bom/schema";

const SORTABLE = ["name", "quantity", "totalCost", "createdAt"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type Filters = { status?: string };

function validate(input: BomFormValues) {
  if (!input.itemId) throw new Error("Finished item is required");
  if (!(Number(input.quantity) > 0)) throw new Error("Quantity must be positive");
  if (!input.items?.length) throw new Error("Add at least one component");
  for (const it of input.items) {
    if (!it.itemId) throw new Error("Every component row needs an item");
    if (!(Number(it.qty) > 0)) throw new Error("Component quantity must be positive");
    if (it.itemId === input.itemId)
      throw new Error("A BOM can't list its own finished item as a component");
  }
}

async function buildRows(items: BomFormValues["items"]) {
  const ids = Array.from(new Set(items.map((i) => i.itemId)));
  const comps = await prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, stockUom: true, valuationRate: true },
  });
  const byId = new Map(comps.map((c) => [c.id, c]));
  return items.map((i) => {
    const c = byId.get(i.itemId);
    const rate = i.rate != null ? i.rate : Number(c?.valuationRate ?? 0);
    return {
      itemId: i.itemId,
      qty: Number(i.qty),
      uom: c?.stockUom ?? "Nos",
      rate,
      amount: round2(Number(i.qty) * rate),
    };
  });
}

// Recursively explode into leaf raw materials (ERPNext BOM Explosion Item).
async function explode(
  tx: Prisma.TransactionClient,
  items: { itemId: string; qty: number; rate: number }[],
  multiplier: number,
  acc: Map<string, { qty: number; rate: number }>,
  visited: Set<string>,
  depth: number,
) {
  if (depth > 20) throw new Error("BOM is nested too deep (possible cycle)");
  for (const it of items) {
    const need = it.qty * multiplier;
    const childBom =
      (await tx.bom.findFirst({
        where: { itemId: it.itemId, status: "SUBMITTED", isActive: true, isDefault: true },
      })) ||
      (await tx.bom.findFirst({
        where: { itemId: it.itemId, status: "SUBMITTED", isActive: true },
      }));
    if (childBom && !visited.has(childBom.id)) {
      const childItems = await tx.bomItem.findMany({ where: { bomId: childBom.id } });
      const factor = need / (childBom.quantity || 1);
      await explode(
        tx,
        childItems.map((c) => ({ itemId: c.itemId, qty: c.qty, rate: Number(c.rate) })),
        factor,
        acc,
        new Set([...visited, childBom.id]),
        depth + 1,
      );
    } else {
      const cur = acc.get(it.itemId) ?? { qty: 0, rate: it.rate };
      cur.qty += need;
      if (it.rate) cur.rate = it.rate;
      acc.set(it.itemId, cur);
    }
  }
}

export async function listBoms(
  p: ListParams,
  filters: Filters = {},
): Promise<ListResponse<BomListItem>> {
  const where: Prisma.BomWhereInput = {
    ...(p.search ? { name: { contains: p.search, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
  };
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.bom.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        item: { select: { itemCode: true, itemName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.bom.count({ where }),
  ]);

  return {
    rows: rows.map((b) => ({
      id: b.id,
      name: b.name,
      itemCode: b.item.itemCode,
      itemName: b.item.itemName,
      quantity: b.quantity,
      status: b.status,
      isDefault: b.isDefault,
      isActive: b.isActive,
      componentCount: b._count.items,
      totalCost: Number(b.totalCost),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getBom(id: string): Promise<BomDetail | null> {
  const b = await prisma.bom.findUnique({
    where: { id },
    include: {
      item: { select: { itemCode: true, itemName: true, stockUom: true } },
      items: { include: { item: { select: { itemCode: true, itemName: true } } } },
      explosionItems: {
        include: { item: { select: { itemCode: true, itemName: true } } },
      },
    },
  });
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    itemId: b.itemId,
    itemCode: b.item.itemCode,
    itemName: b.item.itemName,
    quantity: b.quantity,
    uom: b.uom,
    status: b.status,
    isDefault: b.isDefault,
    isActive: b.isActive,
    totalCost: Number(b.totalCost),
    remarks: b.remarks,
    items: b.items.map((i) => ({
      id: i.id,
      itemId: i.itemId,
      itemCode: i.item.itemCode,
      itemName: i.item.itemName,
      qty: i.qty,
      uom: i.uom,
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
    explosionItems: b.explosionItems.map((i) => ({
      id: i.id,
      itemCode: i.item.itemCode,
      itemName: i.item.itemName,
      qty: i.qty,
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
  };
}

export async function bomOptions(): Promise<BomOption[]> {
  const rows = await prisma.bom.findMany({
    where: { status: "SUBMITTED", isActive: true },
    orderBy: { name: "asc" },
    include: { item: { select: { itemCode: true, itemName: true } } },
  });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    itemCode: b.item.itemCode,
    itemName: b.item.itemName,
    quantity: b.quantity,
  }));
}

export async function createBom(input: BomFormValues) {
  validate(input);
  const item = await prisma.item.findUnique({ where: { id: input.itemId } });
  if (!item) throw new Error("Finished item not found");
  const count = await prisma.bom.count({ where: { itemId: input.itemId } });
  const name = `BOM-${item.itemCode}-${String(count + 1).padStart(3, "0")}`;
  const rows = await buildRows(input.items);

  const bom = await prisma.bom.create({
    data: {
      name,
      itemId: input.itemId,
      quantity: Number(input.quantity),
      uom: item.stockUom,
      remarks: input.remarks?.trim() || null,
      status: "DRAFT",
      items: { create: rows },
    },
  });
  return { id: bom.id, name };
}

export async function updateBom(id: string, input: BomFormValues) {
  validate(input);
  const bom = await prisma.bom.findUnique({ where: { id } });
  if (!bom) throw new Error("BOM not found");
  if (bom.status !== "DRAFT")
    throw new Error("Only draft BOMs can be edited — revise to a new BOM instead");
  const rows = await buildRows(input.items);
  await prisma.$transaction([
    prisma.bomItem.deleteMany({ where: { bomId: id } }),
    prisma.bom.update({
      where: { id },
      data: {
        itemId: input.itemId,
        quantity: Number(input.quantity),
        remarks: input.remarks?.trim() || null,
        items: { create: rows },
      },
    }),
  ]);
  return { id, name: bom.name };
}

export async function deleteBom(id: string) {
  const bom = await prisma.bom.findUnique({ where: { id } });
  if (!bom) throw new Error("BOM not found");
  if (bom.status !== "DRAFT") throw new Error("Only draft BOMs can be deleted");
  await prisma.bom.delete({ where: { id } });
}

export async function submitBom(id: string) {
  await prisma.$transaction(async (tx) => {
    const bom = await tx.bom.findUnique({ where: { id }, include: { items: true } });
    if (!bom) throw new Error("BOM not found");
    if (bom.status !== "DRAFT") throw new Error("Only draft BOMs can be submitted");
    if (bom.items.length === 0)
      throw new Error("Add at least one component before submitting");

    const acc = new Map<string, { qty: number; rate: number }>();
    await explode(
      tx,
      bom.items.map((i) => ({ itemId: i.itemId, qty: i.qty, rate: Number(i.rate) })),
      1,
      acc,
      new Set([bom.id]),
      0,
    );

    let total = 0;
    const explosionRows = Array.from(acc.entries()).map(([itemId, v]) => {
      const amount = round2(v.qty * v.rate);
      total += amount;
      return { bomId: bom.id, itemId, qty: v.qty, rate: v.rate, amount };
    });

    const activeExists = await tx.bom.findFirst({
      where: { itemId: bom.itemId, status: "SUBMITTED", isActive: true },
    });

    await tx.bomExplosionItem.deleteMany({ where: { bomId: bom.id } });
    if (explosionRows.length)
      await tx.bomExplosionItem.createMany({ data: explosionRows });
    await tx.bom.update({
      where: { id: bom.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        totalCost: round2(total),
        isDefault: !activeExists,
      },
    });
  });
}

export async function cancelBom(id: string) {
  const bom = await prisma.bom.findUnique({ where: { id } });
  if (!bom) throw new Error("BOM not found");
  if (bom.status !== "SUBMITTED")
    throw new Error("Only submitted BOMs can be cancelled");
  const openWo = await prisma.workOrder.count({
    where: { bomId: id, status: { in: ["NOT_STARTED", "IN_PROCESS"] } },
  });
  if (openWo > 0)
    throw new Error("Open work orders use this BOM — close them first");
  await prisma.bom.update({
    where: { id },
    data: { status: "CANCELLED", isActive: false, isDefault: false },
  });
}
