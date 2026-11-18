import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  ServiceBay,
  ServiceBayFormValues,
} from "@/modules/dms/service-bays/schema";

const SORTABLE = ["name", "createdAt"] as const;

type Row = Prisma.ServiceBayGetPayload<{
  include: { _count: { select: { jobCards: true } } };
}>;

function toItem(r: Row): ServiceBay {
  return {
    id: r.id,
    name: r.name,
    isHV: r.isHV,
    active: r.active,
    jobCount: r._count.jobCards,
  };
}

function toData(v: ServiceBayFormValues) {
  return { name: v.name.trim(), isHV: v.isHV, active: v.active };
}

export async function listServiceBays(
  p: ListParams,
): Promise<ListResponse<ServiceBay>> {
  const where: Prisma.ServiceBayWhereInput = p.search
    ? { name: { contains: p.search, mode: "insensitive" } }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { name: "asc" });

  const [rows, total] = await Promise.all([
    prisma.serviceBay.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { jobCards: true } } },
    }),
    prisma.serviceBay.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function serviceBayOptions() {
  return prisma.serviceBay.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isHV: true },
  });
}

export async function getServiceBayById(
  id: string,
): Promise<ServiceBay | null> {
  const r = await prisma.serviceBay.findUnique({
    where: { id },
    include: { _count: { select: { jobCards: true } } },
  });
  return r ? toItem(r) : null;
}

export async function createServiceBay(
  values: ServiceBayFormValues,
): Promise<ServiceBay> {
  const r = await prisma.serviceBay.create({
    data: toData(values),
    include: { _count: { select: { jobCards: true } } },
  });
  return toItem(r);
}

export async function updateServiceBay(
  id: string,
  values: ServiceBayFormValues,
): Promise<ServiceBay> {
  const existing = await prisma.serviceBay.findUnique({ where: { id } });
  if (!existing) throw new Error("Service bay not found");
  const r = await prisma.serviceBay.update({
    where: { id },
    data: toData(values),
    include: { _count: { select: { jobCards: true } } },
  });
  return toItem(r);
}

export async function deleteServiceBay(id: string): Promise<void> {
  const [jobs, appts] = await Promise.all([
    prisma.jobCard.count({ where: { bayId: id } }),
    prisma.serviceAppointment.count({ where: { bayId: id } }),
  ]);
  if (jobs + appts > 0)
    throw new Error(
      "Can't delete — this bay is referenced by job cards or appointments. Mark it inactive instead.",
    );
  await prisma.serviceBay.delete({ where: { id } });
}
