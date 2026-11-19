import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  AppointmentAnalytics,
  AppointmentDetail,
  AppointmentFormValues,
  AppointmentListItem,
} from "@/modules/dms/service-appointments/schema";

const SORTABLE = ["name", "requestedAt", "status"] as const;

// HV rule: high-voltage work may only be assigned to an HV-certified technician
// and an HV-equipped bay. Validated whenever an appointment is saved.
async function assertHvAssignment(
  tx: Prisma.TransactionClient,
  v: AppointmentFormValues,
) {
  if (!v.isHV) return;
  if (v.bayId) {
    const bay = await tx.serviceBay.findUnique({ where: { id: v.bayId } });
    if (bay && !bay.isHV)
      throw new Error(
        `Bay "${bay.name}" is not equipped for high-voltage work — pick an HV bay.`,
      );
  }
  if (v.technicianId) {
    const tech = await tx.technician.findUnique({
      where: { id: v.technicianId },
    });
    if (tech && !tech.isHVCertified)
      throw new Error(
        `Technician "${tech.name}" is not HV-certified — assign a certified technician.`,
      );
  }
}

function toData(v: AppointmentFormValues) {
  return {
    vehicleId: v.vehicleId,
    customerName: v.customerName?.trim() || null,
    requestedAt: new Date(v.requestedAt),
    isHV: v.isHV,
    bayId: v.bayId || null,
    technicianId: v.technicianId || null,
    complaint: v.complaint?.trim() || null,
    remarks: v.remarks?.trim() || null,
  };
}

export async function listServiceAppointments(
  p: ListParams,
  filters: { status?: string; vehicleId?: string },
): Promise<ListResponse<AppointmentListItem>> {
  const where: Prisma.ServiceAppointmentWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status =
      filters.status as Prisma.ServiceAppointmentWhereInput["status"];
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (p.search)
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { customerName: { contains: p.search, mode: "insensitive" } },
      { vehicle: { vin: { contains: p.search, mode: "insensitive" } } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { requestedAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.serviceAppointment.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        vehicle: { select: { vin: true, model: true } },
        bay: { select: { name: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.serviceAppointment.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      vehicle: r.vehicle.vin,
      vehicleModel: r.vehicle.model,
      customerName: r.customerName,
      requestedAt: r.requestedAt.toISOString(),
      isHV: r.isHV,
      bay: r.bay?.name ?? null,
      technician: r.technician?.name ?? null,
      status: r.status,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

// Management insights for the Appointments list header.
export async function serviceAppointmentAnalytics(): Promise<AppointmentAnalytics> {
  const [grouped, hv] = await Promise.all([
    prisma.serviceAppointment.groupBy({ by: ["status"], _count: true }),
    prisma.serviceAppointment.count({
      where: { status: "BOOKED", isHV: true },
    }),
  ]);
  const countFor = (s: "BOOKED" | "CONVERTED" | "CANCELLED") =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  return {
    booked: countFor("BOOKED"),
    converted: countFor("CONVERTED"),
    cancelled: countFor("CANCELLED"),
    hv,
    byStatus: [
      { name: "Booked", value: countFor("BOOKED") },
      { name: "Converted", value: countFor("CONVERTED") },
      { name: "Cancelled", value: countFor("CANCELLED") },
    ],
  };
}

export async function getServiceAppointment(
  id: string,
): Promise<AppointmentDetail | null> {
  const r = await prisma.serviceAppointment.findUnique({
    where: { id },
    include: {
      vehicle: { select: { vin: true, model: true } },
      bay: { select: { name: true } },
      technician: { select: { name: true } },
      jobCard: { select: { name: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    vehicleId: r.vehicleId,
    vehicle: r.vehicle.vin,
    vehicleModel: r.vehicle.model,
    customerName: r.customerName,
    requestedAt: r.requestedAt.toISOString(),
    isHV: r.isHV,
    bayId: r.bayId,
    bay: r.bay?.name ?? null,
    technicianId: r.technicianId,
    technician: r.technician?.name ?? null,
    complaint: r.complaint,
    remarks: r.remarks,
    status: r.status,
    jobCardId: r.jobCardId,
    jobCardName: r.jobCard?.name ?? null,
  };
}

export async function createServiceAppointment(
  values: AppointmentFormValues,
): Promise<{ id: string; name: string }> {
  return prisma.$transaction(async (tx) => {
    await assertHvAssignment(tx, values);
    const year = new Date().getFullYear();
    const count = await tx.serviceAppointment.count();
    const name = `APPT-${year}-${String(count + 1).padStart(5, "0")}`;
    const row = await tx.serviceAppointment.create({
      data: { name, ...toData(values) },
    });
    return { id: row.id, name };
  });
}

export async function updateServiceAppointment(
  id: string,
  values: AppointmentFormValues,
): Promise<{ id: string; name: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.serviceAppointment.findUnique({ where: { id } });
    if (!existing) throw new Error("Appointment not found");
    if (existing.status !== "BOOKED")
      throw new Error("Only booked appointments can be edited");
    await assertHvAssignment(tx, values);
    const row = await tx.serviceAppointment.update({
      where: { id },
      data: toData(values),
    });
    return { id: row.id, name: row.name };
  });
}

export async function deleteServiceAppointment(id: string): Promise<void> {
  const existing = await prisma.serviceAppointment.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.status === "CONVERTED")
    throw new Error(
      "Can't delete — this appointment has been converted to a job card. Cancel it instead.",
    );
  await prisma.serviceAppointment.delete({ where: { id } });
}

export async function cancelServiceAppointment(id: string): Promise<void> {
  const existing = await prisma.serviceAppointment.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Appointment not found");
  if (existing.status !== "BOOKED")
    throw new Error("Only booked appointments can be cancelled");
  await prisma.serviceAppointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// Start work: convert a booked appointment into an OPEN Job Card, carrying the
// vehicle, complaint, assigned technician + bay and the HV flag. Atomic.
export async function startServiceAppointment(
  id: string,
): Promise<{ jobCardId: string; jobCardName: string }> {
  return prisma.$transaction(async (tx) => {
    const appt = await tx.serviceAppointment.findUnique({
      where: { id },
      include: { technician: { select: { name: true } } },
    });
    if (!appt) throw new Error("Appointment not found");
    if (appt.status !== "BOOKED")
      throw new Error("Only booked appointments can be started");

    const year = new Date().getFullYear();
    const count = await tx.jobCard.count();
    const jobName = `JOB-${year}-${String(count + 1).padStart(5, "0")}`;
    const job = await tx.jobCard.create({
      data: {
        name: jobName,
        vehicleId: appt.vehicleId,
        complaint: appt.complaint,
        technician: appt.technician?.name ?? null,
        technicianId: appt.technicianId,
        bayId: appt.bayId,
        isHV: appt.isHV,
      },
    });
    await tx.serviceAppointment.update({
      where: { id },
      data: { status: "CONVERTED", jobCardId: job.id },
    });
    return { jobCardId: job.id, jobCardName: jobName };
  });
}
