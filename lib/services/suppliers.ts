import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type { Supplier, SupplierFormValues } from "@/features/suppliers/schema";

const SORTABLE = ["supplierName", "supplierGroup", "createdAt"] as const;

type Row = Prisma.SupplierGetPayload<object>;

function toItem(r: Row): Supplier {
  return {
    id: r.id,
    supplierName: r.supplierName,
    supplierGroup: r.supplierGroup,
    disabled: r.disabled,
  };
}

function toData(v: SupplierFormValues) {
  return {
    supplierName: v.supplierName.trim(),
    supplierGroup: v.supplierGroup?.trim() || null,
    disabled: v.disabled,
  };
}

export async function listSuppliers(
  p: ListParams,
): Promise<ListResponse<Supplier>> {
  const where: Prisma.SupplierWhereInput = p.search
    ? {
        OR: [
          { supplierName: { contains: p.search, mode: "insensitive" } },
          { supplierGroup: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { supplierName: "asc" });

  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function supplierOptions() {
  const rows = await prisma.supplier.findMany({
    where: { disabled: false },
    orderBy: { supplierName: "asc" },
    select: { id: true, supplierName: true },
  });
  return rows;
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const r = await prisma.supplier.findUnique({ where: { id } });
  return r ? toItem(r) : null;
}

export async function createSupplier(
  values: SupplierFormValues,
): Promise<Supplier> {
  const name = values.supplierName.trim();
  const dupe = await prisma.supplier.findUnique({
    where: { supplierName: name },
  });
  if (dupe) throw new Error(`Supplier "${name}" already exists`);
  const r = await prisma.supplier.create({ data: toData(values) });
  return toItem(r);
}

export async function updateSupplier(
  id: string,
  values: SupplierFormValues,
): Promise<Supplier> {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new Error("Supplier not found");
  const name = values.supplierName.trim();
  if (name !== existing.supplierName) {
    const dupe = await prisma.supplier.findUnique({
      where: { supplierName: name },
    });
    if (dupe) throw new Error(`Supplier "${name}" already exists`);
  }
  const r = await prisma.supplier.update({ where: { id }, data: toData(values) });
  return toItem(r);
}

export async function deleteSupplier(id: string): Promise<void> {
  try {
    await prisma.supplier.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this supplier has transactions. Disable it instead.",
    );
  }
}
