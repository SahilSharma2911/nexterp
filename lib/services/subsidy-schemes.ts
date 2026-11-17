import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  SchemeFormValues,
  SubsidyScheme,
} from "@/modules/dms/subsidy-schemes/schema";

const SORTABLE = ["code", "name", "amount", "createdAt"] as const;

type Row = Prisma.SubsidySchemeGetPayload<{
  include: { _count: { select: { claims: true } } };
}>;

function toItem(r: Row): SubsidyScheme {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    authority: r.authority,
    amount: Number(r.amount),
    validFrom: r.validFrom ? r.validFrom.toISOString() : null,
    validTo: r.validTo ? r.validTo.toISOString() : null,
    status: r.status,
    notes: r.notes,
    claimCount: r._count.claims,
  };
}

function toData(v: SchemeFormValues) {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    authority: v.authority?.trim() || null,
    amount: v.amount,
    validFrom: v.validFrom ? new Date(v.validFrom) : null,
    validTo: v.validTo ? new Date(v.validTo) : null,
    status: v.status,
    notes: v.notes?.trim() || null,
  };
}

export async function listSchemes(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<SubsidyScheme>> {
  const where: Prisma.SubsidySchemeWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as Prisma.SubsidySchemeWhereInput["status"];
  if (p.search)
    where.OR = [
      { code: { contains: p.search, mode: "insensitive" } },
      { name: { contains: p.search, mode: "insensitive" } },
      { authority: { contains: p.search, mode: "insensitive" } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.subsidyScheme.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { claims: true } } },
    }),
    prisma.subsidyScheme.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function schemeOptions() {
  const rows = await prisma.subsidyScheme.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true, amount: true },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    amount: Number(r.amount),
  }));
}

export async function getSchemeById(id: string): Promise<SubsidyScheme | null> {
  const r = await prisma.subsidyScheme.findUnique({
    where: { id },
    include: { _count: { select: { claims: true } } },
  });
  return r ? toItem(r) : null;
}

export async function createScheme(
  values: SchemeFormValues,
): Promise<SubsidyScheme> {
  const code = values.code.trim();
  const dupe = await prisma.subsidyScheme.findUnique({ where: { code } });
  if (dupe) throw new Error(`Scheme code "${code}" already exists`);
  const r = await prisma.subsidyScheme.create({
    data: toData(values),
    include: { _count: { select: { claims: true } } },
  });
  return toItem(r);
}

export async function updateScheme(
  id: string,
  values: SchemeFormValues,
): Promise<SubsidyScheme> {
  const existing = await prisma.subsidyScheme.findUnique({ where: { id } });
  if (!existing) throw new Error("Scheme not found");
  const code = values.code.trim();
  if (code !== existing.code) {
    const dupe = await prisma.subsidyScheme.findUnique({ where: { code } });
    if (dupe) throw new Error(`Scheme code "${code}" already exists`);
  }
  const r = await prisma.subsidyScheme.update({
    where: { id },
    data: toData(values),
    include: { _count: { select: { claims: true } } },
  });
  return toItem(r);
}

export async function deleteScheme(id: string): Promise<void> {
  try {
    await prisma.subsidyScheme.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this scheme has claims. Close it instead.",
    );
  }
}
