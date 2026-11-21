import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Technician,
  TechnicianAnalytics,
  TechnicianDetail,
  TechnicianFormValues,
  TechnicianProductivity,
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

// Split a free-text skills string ("HV battery, Motor rewind / Brakes") into
// normalised, title-cased skill tags for the skill-distribution chart.
function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,/;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export async function technicianAnalytics(): Promise<TechnicianAnalytics> {
  const techs = await prisma.technician.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      skills: true,
      isHVCertified: true,
      active: true,
      jobCards: {
        select: {
          status: true,
          total: true,
          createdAt: true,
          completedAt: true,
        },
      },
    },
  });

  const skillCounts = new Map<string, number>();
  let openJobs = 0;
  let busy = 0;
  let totalJobs = 0;

  const productivity: TechnicianProductivity[] = techs.map((t) => {
    let open = 0;
    let completed = 0;
    let revenue = 0;
    let turnaroundMs = 0;
    let turnaroundN = 0;

    for (const j of t.jobCards) {
      if (j.status === "OPEN") open++;
      else if (j.status === "COMPLETED") {
        completed++;
        revenue += Number(j.total);
        if (j.completedAt) {
          turnaroundMs += j.completedAt.getTime() - j.createdAt.getTime();
          turnaroundN++;
        }
      }
    }

    openJobs += open;
    totalJobs += t.jobCards.length;
    if (open > 0) busy++;

    // Count each distinct skill tag once per technician.
    for (const s of new Set(parseSkills(t.skills)))
      skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);

    return {
      id: t.id,
      name: t.name,
      isHVCertified: t.isHVCertified,
      active: t.active,
      openJobs: open,
      completedJobs: completed,
      revenue,
      avgTurnaroundHours: turnaroundN
        ? Math.round((turnaroundMs / turnaroundN / 3_600_000) * 10) / 10
        : null,
    };
  });

  const active = techs.filter((t) => t.active).length;
  const hvCertified = techs.filter((t) => t.isHVCertified).length;

  const workload = productivity
    .map((p) => ({ name: p.name, value: p.openJobs + p.completedJobs }))
    .filter((w) => w.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const skills = [...skillCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const productivitySorted = [...productivity].sort(
    (a, b) =>
      b.completedJobs - a.completedJobs ||
      b.revenue - a.revenue ||
      a.name.localeCompare(b.name),
  );

  return {
    total: techs.length,
    active,
    hvCertified,
    openJobs,
    busy,
    utilization: active ? Math.round((busy / active) * 100) : 0,
    avgJobsPerTech: techs.length
      ? Math.round((totalJobs / techs.length) * 10) / 10
      : 0,
    workload,
    certification: [
      { name: "HV certified", value: hvCertified },
      { name: "Standard", value: techs.length - hvCertified },
    ],
    skills,
    productivity: productivitySorted,
  };
}

// Six-month completion trend for a single technician.
function monthlyCompletions(
  rows: { completedAt: Date | null }[],
): { name: string; value: number }[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString("en-US", { month: "short" }),
    };
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.completedAt) continue;
    const d = r.completedAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((m) => ({ name: m.name, value: counts.get(m.key) ?? 0 }));
}

export async function technicianDetail(
  id: string,
): Promise<TechnicianDetail | null> {
  const t = await prisma.technician.findUnique({
    where: { id },
    include: {
      _count: { select: { appointments: true } },
      jobCards: {
        orderBy: { serviceDate: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          total: true,
          partsTotal: true,
          laborTotal: true,
          isHV: true,
          serviceDate: true,
          createdAt: true,
          completedAt: true,
          vehicle: { select: { id: true, vin: true, model: true } },
        },
      },
    },
  });
  if (!t) return null;

  let openJobs = 0;
  let completedJobs = 0;
  let cancelledJobs = 0;
  let hvJobs = 0;
  let revenue = 0;
  let partsValue = 0;
  let laborValue = 0;
  let turnaroundMs = 0;
  let turnaroundN = 0;
  const completedRows: { completedAt: Date | null }[] = [];

  for (const j of t.jobCards) {
    if (j.isHV) hvJobs++;
    if (j.status === "OPEN") openJobs++;
    else if (j.status === "CANCELLED") cancelledJobs++;
    else if (j.status === "COMPLETED") {
      completedJobs++;
      revenue += Number(j.total);
      partsValue += Number(j.partsTotal);
      laborValue += Number(j.laborTotal);
      completedRows.push({ completedAt: j.completedAt });
      if (j.completedAt) {
        turnaroundMs += j.completedAt.getTime() - j.createdAt.getTime();
        turnaroundN++;
      }
    }
  }

  return {
    id: t.id,
    name: t.name,
    phone: t.phone,
    skills: t.skills,
    skillTags: parseSkills(t.skills),
    isHVCertified: t.isHVCertified,
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    totalJobs: t.jobCards.length,
    openJobs,
    completedJobs,
    cancelledJobs,
    hvJobs,
    appointments: t._count.appointments,
    revenue,
    partsValue,
    laborValue,
    avgTurnaroundHours: turnaroundN
      ? Math.round((turnaroundMs / turnaroundN / 3_600_000) * 10) / 10
      : null,
    completionsByMonth: monthlyCompletions(completedRows),
    statusBreakdown: [
      { name: "Open", value: openJobs },
      { name: "Completed", value: completedJobs },
      { name: "Cancelled", value: cancelledJobs },
    ],
    recentJobs: t.jobCards.slice(0, 8).map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      vehicleId: j.vehicle.id,
      vin: j.vehicle.vin,
      model: j.vehicle.model,
      total: Number(j.total),
      isHV: j.isHV,
      serviceDate: j.serviceDate.toISOString(),
    })),
  };
}
