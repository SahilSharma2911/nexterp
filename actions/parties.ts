"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* ---- Customer ---- */
export async function upsertCustomer(input: { id?: string; customerName: string; customerGroup?: string; territory?: string; disabled?: boolean }) {
  if (!input.customerName?.trim()) throw new Error("Customer Name is required");
  const data = { customerName: input.customerName.trim(), customerGroup: input.customerGroup?.trim() || null, territory: input.territory?.trim() || null, disabled: !!input.disabled };
  let id = input.id;
  if (id) await prisma.customer.update({ where: { id }, data });
  else {
    const dupe = await prisma.customer.findUnique({ where: { customerName: data.customerName } });
    if (dupe) throw new Error(`Customer "${data.customerName}" already exists`);
    id = (await prisma.customer.create({ data })).id;
  }
  revalidatePath("/selling/customers");
  return { ok: true, id };
}
export async function getCustomers() {
  const rows = await prisma.customer.findMany({ orderBy: { customerName: "asc" } });
  return rows.map((c) => ({ id: c.id, customerName: c.customerName, customerGroup: c.customerGroup, territory: c.territory, disabled: c.disabled }));
}
export async function getCustomer(id: string) {
  const c = await prisma.customer.findUnique({ where: { id } });
  return c ? { id: c.id, customerName: c.customerName, customerGroup: c.customerGroup, territory: c.territory, disabled: c.disabled } : null;
}
export async function getCustomerOptions() {
  const rows = await prisma.customer.findMany({ where: { disabled: false }, orderBy: { customerName: "asc" }, select: { id: true, customerName: true } });
  return rows;
}

/* ---- Supplier ---- */
export async function upsertSupplier(input: { id?: string; supplierName: string; supplierGroup?: string; disabled?: boolean }) {
  if (!input.supplierName?.trim()) throw new Error("Supplier Name is required");
  const data = { supplierName: input.supplierName.trim(), supplierGroup: input.supplierGroup?.trim() || null, disabled: !!input.disabled };
  let id = input.id;
  if (id) await prisma.supplier.update({ where: { id }, data });
  else {
    const dupe = await prisma.supplier.findUnique({ where: { supplierName: data.supplierName } });
    if (dupe) throw new Error(`Supplier "${data.supplierName}" already exists`);
    id = (await prisma.supplier.create({ data })).id;
  }
  revalidatePath("/buying/suppliers");
  return { ok: true, id };
}
export async function getSuppliers() {
  const rows = await prisma.supplier.findMany({ orderBy: { supplierName: "asc" } });
  return rows.map((s) => ({ id: s.id, supplierName: s.supplierName, supplierGroup: s.supplierGroup, disabled: s.disabled }));
}
export async function getSupplier(id: string) {
  const s = await prisma.supplier.findUnique({ where: { id } });
  return s ? { id: s.id, supplierName: s.supplierName, supplierGroup: s.supplierGroup, disabled: s.disabled } : null;
}
export async function getSupplierOptions() {
  const rows = await prisma.supplier.findMany({ where: { disabled: false }, orderBy: { supplierName: "asc" }, select: { id: true, supplierName: true } });
  return rows;
}
