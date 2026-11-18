import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Technician,
  TechnicianFormValues,
} from "@/modules/dms/technicians/schema";

const SORTABLE = ["name", "createdAt"] as const;

type Row = Prisma.TechnicianGetPayload<{
  include: { _count: { select: { jobCards: true } } };
}>;

function toItem(r: Row): Technician {
  return {
    id: r.id,
    name: r.name,
    skills: r.skills,
    phone: r.phone,
    isHVCertified: r.isHVCertified,
    active: r.active,
    jobCount: r._count.jobCards,
  };
}

function toData(v: TechnicianFormValues) {
  return {
    name: v.name.trim(),
    skills: v.skills?.trim() || null,
    phone: v.phone?.trim() || null,
    isHVCertified: v.isHVCertified,
    active: v.active,
  };
}

export async function listTechnicians(
  p: ListParams,
): Promise<ListResponse<Technician>> {
  const where: Prisma.TechnicianWhereInput = p.search
    ? {
        OR: [
          { name: { contains: p.search, mode: "insensitive" } },
          { skills: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { name: "asc" });

  const [rows, total] = await Promise.all([
    prisma.technician.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { _count: { select: { jobCards: true } } },
    }),
    prisma.technician.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function technicianOptions() {
  return prisma.technician.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isHVCertified: true },
  });
}

export async function getTechnicianById(
  id: string,
): Promise<Technician | null> {
  const r = await prisma.technician.findUnique({
    where: { id },
    include: { _count: { select: { jobCards: true } } },
  });
  return r ? toItem(r) : null;
}

export async function createTechnician(
  values: TechnicianFormValues,
): Promise<Technician> {
  const r = await prisma.technician.create({
    data: toData(values),
    include: { _count: { select: { jobCards: true } } },
  });
  return toItem(r);
}

export async function updateTechnician(
  id: string,
  values: TechnicianFormValues,
): Promise<Technician> {
  const existing = await prisma.technician.findUnique({ where: { id } });
  if (!existing) throw new Error("Technician not found");
  const r = await prisma.technician.update({
    where: { id },
    data: toData(values),
    include: { _count: { select: { jobCards: true } } },
  });
  return toItem(r);
}

export async function deleteTechnician(id: string): Promise<void> {
  const [jobs, appts] = await Promise.all([
    prisma.jobCard.count({ where: { technicianId: id } }),
    prisma.serviceAppointment.count({ where: { technicianId: id } }),
  ]);
  if (jobs + appts > 0)
    throw new Error(
      "Can't delete — this technician is referenced by job cards or appointments. Mark them inactive instead.",
    );
  await prisma.technician.delete({ where: { id } });
}
