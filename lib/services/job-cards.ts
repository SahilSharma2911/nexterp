import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postStockLedger } from "@/lib/stock-ledger";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";
import type {
  JobCardAnalytics,
  JobCardDetail,
  JobCardFormValues,
  JobCardListItem,
} from "@/modules/dms/job-cards/schema";

const VT = "Job Card";
const SORTABLE = ["name", "serviceDate", "total", "status"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function priceLines(v: JobCardFormValues) {
  const parts = v.parts.map((p) => ({
    itemId: p.itemId,
    qty: p.qty,
    rate: p.rate,
    amount: round2(p.qty * p.rate),
  }));
  const labor = v.labor.map((l) => ({
    description: l.description.trim(),
    hours: l.hours,
    rate: l.rate,
    amount: round2(l.hours * l.rate),
  }));
  const partsTotal = round2(parts.reduce((s, p) => s + p.amount, 0));
  const laborTotal = round2(labor.reduce((s, l) => s + l.amount, 0));
  return {
    parts,
    labor,
    partsTotal,
    laborTotal,
    total: round2(partsTotal + laborTotal),
  };
}

// Revenue account for services: prefer "Service Income", fall back to "Sales".
async function serviceIncomeAccountId(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const a =
    (await tx.account.findFirst({ where: { accountName: "Service Income" } })) ??
    (await tx.account.findFirst({ where: { accountName: "Sales" } }));
  if (!a)
    throw new Error(
      'No "Service Income" or "Sales" account — seed the chart of accounts first',
    );
  return a.id;
}

async function itemNames(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map<string, { code: string; name: string }>();
  const rows = await prisma.item.findMany({
    where: { id: { in: unique } },
    select: { id: true, itemCode: true, itemName: true },
  });
  return new Map(rows.map((r) => [r.id, { code: r.itemCode, name: r.itemName }]));
}

async function warehouseName(id: string | null) {
  if (!id) return null;
  const w = await prisma.warehouse.findUnique({
    where: { id },
    select: { warehouseName: true },
  });
  return w?.warehouseName ?? null;
}

export async function listJobCards(
  p: ListParams,
  filters: { status?: string; vehicleId?: string },
): Promise<ListResponse<JobCardListItem>> {
  const where: Prisma.JobCardWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as Prisma.JobCardWhereInput["status"];
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (p.search)
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { vehicle: { vin: { contains: p.search, mode: "insensitive" } } },
      { technician: { contains: p.search, mode: "insensitive" } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { serviceDate: "desc" });

  const [rows, total] = await Promise.all([
    prisma.jobCard.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        vehicle: { select: { vin: true, model: true } },
        technicianRef: { select: { name: true } },
      },
    }),
    prisma.jobCard.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      vehicle: r.vehicle.vin,
      vehicleModel: r.vehicle.model,
      technician: r.technicianRef?.name ?? r.technician,
      isHV: r.isHV,
      status: r.status,
      serviceDate: r.serviceDate.toISOString(),
      total: Number(r.total),
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getJobCard(id: string): Promise<JobCardDetail | null> {
  const r = await prisma.jobCard.findUnique({
    where: { id },
    include: {
      vehicle: { select: { vin: true, model: true } },
      technicianRef: { select: { name: true } },
      bay: { select: { name: true } },
      appointment: { select: { id: true, name: true } },
      parts: true,
      labor: true,
    },
  });
  if (!r) return null;
  const items = await itemNames(r.parts.map((p) => p.itemId));
  return {
    id: r.id,
    name: r.name,
    vehicleId: r.vehicleId,
    vehicle: r.vehicle.vin,
    vehicleModel: r.vehicle.model,
    warehouseId: r.warehouseId,
    warehouse: await warehouseName(r.warehouseId),
    status: r.status,
    complaint: r.complaint,
    technician: r.technician,
    technicianId: r.technicianId,
    technicianName: r.technicianRef?.name ?? null,
    bayId: r.bayId,
    bayName: r.bay?.name ?? null,
    isHV: r.isHV,
    odometer: r.odometer,
    serviceDate: r.serviceDate.toISOString(),
    partsTotal: Number(r.partsTotal),
    laborTotal: Number(r.laborTotal),
    total: Number(r.total),
    remarks: r.remarks,
    photos: r.photos,
    qcBy: r.qcBy,
    qcAt: r.qcAt ? r.qcAt.toISOString() : null,
    qcNote: r.qcNote,
    appointmentId: r.appointment?.id ?? null,
    appointmentName: r.appointment?.name ?? null,
    parts: r.parts.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      itemCode: items.get(p.itemId)?.code ?? "—",
      itemName: items.get(p.itemId)?.name ?? "",
      qty: p.qty,
      rate: Number(p.rate),
      amount: Number(p.amount),
    })),
    labor: r.labor.map((l) => ({
      id: l.id,
      description: l.description,
      hours: l.hours,
      rate: Number(l.rate),
      amount: Number(l.amount),
    })),
  };
}

export async function createJobCard(
  values: JobCardFormValues,
): Promise<{ id: string; name: string }> {
  const { parts, labor, partsTotal, laborTotal, total } = priceLines(values);
  const year = new Date().getFullYear();
  const count = await prisma.jobCard.count();
  const name = `JOB-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.jobCard.create({
    data: {
      name,
      vehicleId: values.vehicleId,
      warehouseId: values.warehouseId || null,
      complaint: values.complaint?.trim() || null,
      technician: values.technician?.trim() || null,
      technicianId: values.technicianId || null,
      bayId: values.bayId || null,
      isHV: values.isHV ?? false,
      odometer: values.odometer ?? null,
      serviceDate: values.serviceDate ? new Date(values.serviceDate) : new Date(),
      partsTotal,
      laborTotal,
      total,
      remarks: values.remarks?.trim() || null,
      photos: values.photos ?? [],
      parts: { create: parts },
      labor: { create: labor },
    },
  });
  return { id: row.id, name };
}

export async function updateJobCard(
  id: string,
  values: JobCardFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.jobCard.findUnique({ where: { id } });
  if (!existing) throw new Error("Job Card not found");
  if (existing.status !== "OPEN")
    throw new Error("Only open job cards can be edited");
  const { parts, labor, partsTotal, laborTotal, total } = priceLines(values);
  const row = await prisma.$transaction(async (tx) => {
    await tx.jobCardPart.deleteMany({ where: { jobCardId: id } });
    await tx.jobCardLabor.deleteMany({ where: { jobCardId: id } });
    return tx.jobCard.update({
      where: { id },
      data: {
        vehicleId: values.vehicleId,
        warehouseId: values.warehouseId || null,
        complaint: values.complaint?.trim() || null,
        technician: values.technician?.trim() || null,
        technicianId: values.technicianId || null,
        bayId: values.bayId || null,
        isHV: values.isHV ?? false,
        odometer: values.odometer ?? null,
        serviceDate: values.serviceDate
          ? new Date(values.serviceDate)
          : existing.serviceDate,
        partsTotal,
        laborTotal,
        total,
        remarks: values.remarks?.trim() || null,
        photos: values.photos ?? [],
        parts: { create: parts },
        labor: { create: labor },
      },
    });
  });
  return { id: row.id, name: row.name };
}

export async function deleteJobCard(id: string): Promise<void> {
  const existing = await prisma.jobCard.findUnique({ where: { id } });
  if (!existing) throw new Error("Job Card not found");
  if (existing.status !== "OPEN")
    throw new Error("Only open job cards can be deleted");
  await prisma.jobCard.delete({ where: { id } });
}

// Management insights for the Job Cards list header.
export async function jobCardAnalytics(): Promise<JobCardAnalytics> {
  const [grouped, done] = await Promise.all([
    prisma.jobCard.groupBy({ by: ["status"], _count: true }),
    prisma.jobCard.aggregate({
      _sum: { total: true, partsTotal: true, laborTotal: true },
      where: { status: "COMPLETED" },
    }),
  ]);
  const countFor = (s: "OPEN" | "COMPLETED" | "CANCELLED") =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  return {
    open: countFor("OPEN"),
    completed: countFor("COMPLETED"),
    cancelled: countFor("CANCELLED"),
    revenue: Number(done._sum.total ?? 0),
    partsValue: Number(done._sum.partsTotal ?? 0),
    laborValue: Number(done._sum.laborTotal ?? 0),
    byStatus: [
      { name: "Open", value: countFor("OPEN") },
      { name: "Completed", value: countFor("COMPLETED") },
      { name: "Cancelled", value: countFor("CANCELLED") },
    ],
  };
}

// Complete: issue parts through the CORE stock ledger and post service revenue
// to the CORE general ledger — the whole point of the DMS reusing the ERP.
export async function completeJobCard(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const job = await tx.jobCard.findUnique({
      where: { id },
      include: { parts: true, vehicle: { select: { vin: true } } },
    });
    if (!job) throw new Error("Job Card not found");
    if (job.status !== "OPEN")
      throw new Error("Only open job cards can be completed");

    if (job.parts.length && !job.warehouseId)
      throw new Error("Select a warehouse to issue the parts from");

    // 1) Inventory — issue each part from the service warehouse.
    for (const p of job.parts) {
      await postStockLedger(tx, {
        itemId: p.itemId,
        warehouseId: job.warehouseId!,
        actualQty: -p.qty,
        voucherType: VT,
        voucherNo: job.name,
        voucherDetailId: p.id,
        postingAt: job.serviceDate,
      });
    }

    // 2) Accounting — bill the customer: Debtors Dr / Service Income Cr.
    const total = Number(job.total);
    if (total > 0) {
      const debtors = await getAccountId(tx, "Debtors");
      const income = await serviceIncomeAccountId(tx);
      await postGL(tx, {
        lines: [
          { accountId: debtors, debit: total },
          { accountId: income, credit: total },
        ],
        voucherType: VT,
        voucherNo: job.name,
        postingAt: job.serviceDate,
        againstParty: job.vehicle.vin,
      });
    }

    await tx.jobCard.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
}

// Quality-check sign-off (Service & Workshop). Records who inspected the work
// and an optional note. Non-gating in v1 — it does not block completion, it
// just stamps the QC onto the job card's audit trail. Allowed while OPEN.
export async function recordJobCardQc(
  id: string,
  values: { qcBy: string; qcNote?: string },
): Promise<void> {
  const job = await prisma.jobCard.findUnique({ where: { id } });
  if (!job) throw new Error("Job Card not found");
  if (job.status !== "OPEN")
    throw new Error("Quality checks can only be recorded on open job cards");
  await prisma.jobCard.update({
    where: { id },
    data: {
      qcBy: values.qcBy.trim(),
      qcNote: values.qcNote?.trim() || null,
      qcAt: new Date(),
    },
  });
}

export async function cancelJobCard(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const job = await tx.jobCard.findUnique({ where: { id } });
    if (!job) throw new Error("Job Card not found");
    if (job.status !== "COMPLETED")
      throw new Error("Only completed job cards can be cancelled");

    // Reverse the stock issues (re-post opposite SLEs, then mark cancelled).
    const sles = await tx.stockLedgerEntry.findMany({
      where: { voucherType: VT, voucherNo: job.name, isCancelled: false },
    });
    for (const s of sles) {
      await postStockLedger(tx, {
        itemId: s.itemId,
        warehouseId: s.warehouseId,
        actualQty: -s.actualQty,
        incomingRate: Number(s.valuationRate),
        voucherType: VT,
        voucherNo: job.name,
        voucherDetailId: s.voucherDetailId,
        postingAt: new Date(),
      });
    }
    await tx.stockLedgerEntry.updateMany({
      where: { voucherType: VT, voucherNo: job.name, isCancelled: false },
      data: { isCancelled: true },
    });

    // Reverse the GL revenue.
    await reverseGL(tx, VT, job.name, new Date());

    await tx.jobCard.update({
      where: { id: job.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
