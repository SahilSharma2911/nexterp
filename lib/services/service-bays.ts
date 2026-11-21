import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  BayJobRow,
  ScheduleAppointment,
  ServiceBay,
  ServiceBayDashboard,
  ServiceBayDetail,
  ServiceBayFormValues,
} from "@/modules/dms/service-bays/schema";

const SORTABLE = ["name", "createdAt"] as const;

// Today's [start, end) in server-local time, for "today's schedule" queries.
function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

type ApptRow = Prisma.ServiceAppointmentGetPayload<{
  include: {
    vehicle: { select: { vin: true; model: true } };
    bay: { select: { name: true } };
    technician: { select: { id: true; name: true } };
  };
}>;

function toSchedule(a: ApptRow): ScheduleAppointment {
  return {
    id: a.id,
    name: a.name,
    requestedAt: a.requestedAt.toISOString(),
    customerName: a.customerName,
    vehicleId: a.vehicleId,
    vin: a.vehicle.vin,
    model: a.vehicle.model,
    bayId: a.bayId,
    bayName: a.bay?.name ?? null,
    technicianId: a.technicianId,
    technicianName: a.technician?.name ?? null,
    isHV: a.isHV,
    status: a.status,
    complaint: a.complaint,
  };
}

const APPT_INCLUDE = {
  vehicle: { select: { vin: true, model: true } },
  bay: { select: { name: true } },
  technician: { select: { id: true, name: true } },
} as const;

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

export async function serviceBayDashboard(): Promise<ServiceBayDashboard> {
  const { start, end } = todayRange();

  const [bays, techs, todayAppts, upcomingAppts, upcomingCount] =
    await Promise.all([
      prisma.serviceBay.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          isHV: true,
          active: true,
          jobCards: { where: { status: "OPEN" }, select: { id: true } },
        },
      }),
      prisma.technician.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          isHVCertified: true,
          jobCards: { where: { status: "OPEN" }, select: { id: true } },
        },
      }),
      prisma.serviceAppointment.findMany({
        where: { status: "BOOKED", requestedAt: { gte: start, lt: end } },
        orderBy: { requestedAt: "asc" },
        include: APPT_INCLUDE,
      }),
      prisma.serviceAppointment.findMany({
        where: { status: "BOOKED", requestedAt: { gte: end } },
        orderBy: { requestedAt: "asc" },
        take: 8,
        include: APPT_INCLUDE,
      }),
      prisma.serviceAppointment.count({
        where: { status: "BOOKED", requestedAt: { gte: end } },
      }),
    ]);

  const today = todayAppts.map(toSchedule);

  // Appointments-today counts per bay / technician.
  const bayBookings = new Map<string, number>();
  const techBookings = new Map<string, number>();
  for (const a of todayAppts) {
    if (a.bayId) bayBookings.set(a.bayId, (bayBookings.get(a.bayId) ?? 0) + 1);
    if (a.technicianId)
      techBookings.set(
        a.technicianId,
        (techBookings.get(a.technicianId) ?? 0) + 1,
      );
  }

  const bayUtilization = bays.map((b) => ({
    id: b.id,
    name: b.name,
    isHV: b.isHV,
    active: b.active,
    todayBookings: bayBookings.get(b.id) ?? 0,
    openJobs: b.jobCards.length,
  }));

  const technicians = techs.map((t) => {
    const openJobs = t.jobCards.length;
    const todayAppointments = techBookings.get(t.id) ?? 0;
    return {
      id: t.id,
      name: t.name,
      isHVCertified: t.isHVCertified,
      openJobs,
      todayAppointments,
      busy: openJobs > 0 || todayAppointments > 0,
    };
  });

  const activeBays = bays.filter((b) => b.active).length;
  const busyBays = bayUtilization.filter(
    (b) => b.active && (b.todayBookings > 0 || b.openJobs > 0),
  ).length;

  return {
    bays: bays.length,
    activeBays,
    hvBays: bays.filter((b) => b.isHV).length,
    todayCount: today.length,
    upcomingCount,
    utilization: activeBays ? Math.round((busyBays / activeBays) * 100) : 0,
    today,
    upcoming: upcomingAppts.map(toSchedule),
    technicians,
    bayUtilization,
  };
}

export async function serviceBayDetail(
  id: string,
): Promise<ServiceBayDetail | null> {
  const { start, end } = todayRange();

  const bay = await prisma.serviceBay.findUnique({
    where: { id },
    select: { id: true, name: true, isHV: true, active: true, createdAt: true },
  });
  if (!bay) return null;

  const [grouped, apptTotal, todayBookings, upcoming, recentJobs] =
    await Promise.all([
      prisma.jobCard.groupBy({
        by: ["status"],
        where: { bayId: id },
        _count: true,
      }),
      prisma.serviceAppointment.count({ where: { bayId: id } }),
      prisma.serviceAppointment.count({
        where: { bayId: id, status: "BOOKED", requestedAt: { gte: start, lt: end } },
      }),
      prisma.serviceAppointment.findMany({
        where: { bayId: id, status: "BOOKED", requestedAt: { gte: end } },
        orderBy: { requestedAt: "asc" },
        take: 6,
        include: APPT_INCLUDE,
      }),
      prisma.jobCard.findMany({
        where: { bayId: id },
        orderBy: { serviceDate: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          status: true,
          total: true,
          isHV: true,
          serviceDate: true,
          vehicle: { select: { id: true, vin: true, model: true } },
          technicianRef: { select: { name: true } },
          technician: true,
        },
      }),
    ]);

  const countFor = (s: "OPEN" | "COMPLETED" | "CANCELLED") =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  const totalJobs = grouped.reduce((s, g) => s + g._count, 0);

  const jobs: BayJobRow[] = recentJobs.map((j) => ({
    id: j.id,
    name: j.name,
    status: j.status,
    vehicleId: j.vehicle.id,
    vin: j.vehicle.vin,
    model: j.vehicle.model,
    technicianName: j.technicianRef?.name ?? j.technician ?? null,
    total: Number(j.total),
    isHV: j.isHV,
    serviceDate: j.serviceDate.toISOString(),
  }));

  return {
    id: bay.id,
    name: bay.name,
    isHV: bay.isHV,
    active: bay.active,
    createdAt: bay.createdAt.toISOString(),
    totalJobs,
    openJobs: countFor("OPEN"),
    completedJobs: countFor("COMPLETED"),
    appointments: apptTotal,
    todayBookings,
    upcoming: upcoming.map(toSchedule),
    recentJobs: jobs,
  };
}
