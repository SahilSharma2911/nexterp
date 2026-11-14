import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type { Customer, CustomerFormValues } from "@/features/customers/schema";

const SORTABLE = [
  "customerName",
  "customerGroup",
  "territory",
  "createdAt",
] as const;

type Row = Prisma.CustomerGetPayload<object>;

function toItem(r: Row): Customer {
  return {
    id: r.id,
    customerName: r.customerName,
    customerGroup: r.customerGroup,
    territory: r.territory,
    disabled: r.disabled,
  };
}

function toData(v: CustomerFormValues) {
  return {
    customerName: v.customerName.trim(),
    customerGroup: v.customerGroup?.trim() || null,
    territory: v.territory?.trim() || null,
    disabled: v.disabled,
  };
}

export async function listCustomers(
  p: ListParams,
): Promise<ListResponse<Customer>> {
  const where: Prisma.CustomerWhereInput = p.search
    ? {
        OR: [
          { customerName: { contains: p.search, mode: "insensitive" } },
          { customerGroup: { contains: p.search, mode: "insensitive" } },
          { territory: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { customerName: "asc" });

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function customerOptions() {
  const rows = await prisma.customer.findMany({
    where: { disabled: false },
    orderBy: { customerName: "asc" },
    select: { id: true, customerName: true },
  });
  return rows;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const r = await prisma.customer.findUnique({ where: { id } });
  return r ? toItem(r) : null;
}

export async function createCustomer(
  values: CustomerFormValues,
): Promise<Customer> {
  const name = values.customerName.trim();
  const dupe = await prisma.customer.findUnique({
    where: { customerName: name },
  });
  if (dupe) throw new Error(`Customer "${name}" already exists`);
  const r = await prisma.customer.create({ data: toData(values) });
  return toItem(r);
}

export async function updateCustomer(
  id: string,
  values: CustomerFormValues,
): Promise<Customer> {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new Error("Customer not found");
  const name = values.customerName.trim();
  if (name !== existing.customerName) {
    const dupe = await prisma.customer.findUnique({
      where: { customerName: name },
    });
    if (dupe) throw new Error(`Customer "${name}" already exists`);
  }
  const r = await prisma.customer.update({ where: { id }, data: toData(values) });
  return toItem(r);
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await prisma.customer.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this customer has transactions. Disable it instead.",
    );
  }
}
