import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type { Dealer, DealerFormValues } from "@/modules/dms/dealers/schema";

const SORTABLE = ["code", "name", "city", "createdAt"] as const;

type Row = Prisma.DealerGetPayload<{ include: { _count: { select: { vehicles: true } } } }>;

function toItem(r: Row): Dealer {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    legalName: r.legalName,
    contactPerson: r.contactPerson,
    phone: r.phone,
    email: r.email,
    gstin: r.gstin,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    city: r.city,
    state: r.state,
    country: r.country,
    postalCode: r.postalCode,
    disabled: r.disabled,
    vehicleCount: r._count.vehicles,
  };
}

function toData(v: DealerFormValues) {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    legalName: v.legalName?.trim() || null,
    contactPerson: v.contactPerson?.trim() || null,
    phone: v.phone?.trim() || null,
    email: v.email?.trim() || null,
    gstin: v.gstin?.trim() || null,
    addressLine1: v.addressLine1?.trim() || null,
    addressLine2: v.addressLine2?.trim() || null,
    city: v.city?.trim() || null,
    state: v.state?.trim() || null,
    country: v.country?.trim() || null,
    postalCode: v.postalCode?.trim() || null,
    disabled: v.disabled,
  };
}

export async function listDealers(
  p: ListParams,
): Promise<ListResponse<Dealer>> {
  const where: Prisma.DealerWhereInput = p.search
    ? {
        OR: [
          { code: { contains: p.search, mode: "insensitive" } },
          { name: { contains: p.search, mode: "insensitive" } },
          { city: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { name: "asc" });

  const [rows, total] = await Promise.all([
    prisma.dealer.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { vehicles: true } } },
    }),
    prisma.dealer.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function dealerOptions() {
  const rows = await prisma.dealer.findMany({
    where: { disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
  return rows;
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  const r = await prisma.dealer.findUnique({
    where: { id },
    include: { _count: { select: { vehicles: true } } },
  });
  return r ? toItem(r) : null;
}

export async function createDealer(values: DealerFormValues): Promise<Dealer> {
  const code = values.code.trim();
  const dupe = await prisma.dealer.findUnique({ where: { code } });
  if (dupe) throw new Error(`Dealer code "${code}" already exists`);
  const r = await prisma.dealer.create({
    data: toData(values),
    include: { _count: { select: { vehicles: true } } },
  });
  return toItem(r);
}

export async function updateDealer(
  id: string,
  values: DealerFormValues,
): Promise<Dealer> {
  const existing = await prisma.dealer.findUnique({ where: { id } });
  if (!existing) throw new Error("Dealer not found");
  const code = values.code.trim();
  if (code !== existing.code) {
    const dupe = await prisma.dealer.findUnique({ where: { code } });
    if (dupe) throw new Error(`Dealer code "${code}" already exists`);
  }
  const r = await prisma.dealer.update({
    where: { id },
    data: toData(values),
    include: { _count: { select: { vehicles: true } } },
  });
  return toItem(r);
}

export async function deleteDealer(id: string): Promise<void> {
  try {
    await prisma.dealer.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this dealer has vehicles assigned. Reassign them or disable the dealer instead.",
    );
  }
}
