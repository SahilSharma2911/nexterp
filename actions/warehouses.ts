"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type WarehouseInput = {
  id?: string;
  warehouseName: string;
  warehouseType?: string;
  disabled?: boolean;
};

export async function upsertWarehouse(input: WarehouseInput) {
  if (!input.warehouseName?.trim()) throw new Error("Warehouse Name is required");
  const data = {
    warehouseName: input.warehouseName.trim(),
    warehouseType: input.warehouseType?.trim() || null,
    disabled: !!input.disabled,
  };
  let id = input.id;
  if (id) {
    await prisma.warehouse.update({ where: { id }, data });
  } else {
    const dupe = await prisma.warehouse.findUnique({ where: { warehouseName: data.warehouseName } });
    if (dupe) throw new Error(`Warehouse "${data.warehouseName}" already exists`);
    const row = await prisma.warehouse.create({ data });
    id = row.id;
  }
  revalidatePath("/stock/warehouses");
  return { ok: true, id };
}

export async function getWarehouses() {
  const rows = await prisma.warehouse.findMany({ orderBy: { warehouseName: "asc" } });
  return rows.map((r) => ({ id: r.id, warehouseName: r.warehouseName, warehouseType: r.warehouseType, disabled: r.disabled }));
}

export async function getWarehouse(id: string) {
  const r = await prisma.warehouse.findUnique({ where: { id } });
  if (!r) return null;
  return { id: r.id, warehouseName: r.warehouseName, warehouseType: r.warehouseType, disabled: r.disabled };
}

export async function getWarehouseOptions() {
  const rows = await prisma.warehouse.findMany({
    where: { disabled: false },
    orderBy: { warehouseName: "asc" },
    select: { id: true, warehouseName: true },
  });
  return rows;
}
