import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { postStockLedger } from "@/lib/stock-ledger";
import { allocateFefo } from "@/lib/batch-stock";
import { consumeSerials, restoreSerials } from "@/lib/serial-stock";
import { postGL, getAccountId, reverseGL } from "@/lib/gl";
import type {
  JobCardActivity,
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
    approvedBy: r.approvedBy,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    appointmentId: r.appointment?.id ?? null,
    appointmentName: r.appointment?.name ?? null,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
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
  asEstimate = false,
): Promise<{ id: string; name: string }> {
  const { parts, labor, partsTotal, laborTotal, total } = priceLines(values);
  const year = new Date().getFullYear();
  const count = await prisma.jobCard.count();
  const name = `JOB-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.jobCard.create({
    data: {
      name,
      status: asEstimate ? "ESTIMATE" : "OPEN",
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
  if (existing.status !== "OPEN" && existing.status !== "ESTIMATE")
    throw new Error("Only estimates and open job cards can be edited");
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
  if (existing.status !== "OPEN" && existing.status !== "ESTIMATE")
    throw new Error("Only estimates and open job cards can be deleted");
  await prisma.jobCard.delete({ where: { id } });
}

// Quick-assign the technician + bay without the full edit form. Enforces the
// same HV rule as appointments: HV jobs need an HV bay + HV-certified tech.
export async function assignJobCard(
  id: string,
  input: { bayId?: string | null; technicianId?: string | null },
): Promise<void> {
  const job = await prisma.jobCard.findUnique({ where: { id } });
  if (!job) throw new Error("Job Card not found");
  if (job.status !== "OPEN" && job.status !== "ESTIMATE")
    throw new Error("Only estimates and open job cards can be reassigned");

  if (input.bayId) {
    const bay = await prisma.serviceBay.findUnique({
      where: { id: input.bayId },
    });
    if (!bay) throw new Error("Selected service bay no longer exists");
    if (job.isHV && !bay.isHV)
      throw new Error(
        `Bay "${bay.name}" is not equipped for high-voltage work — pick an HV bay.`,
      );
  }
  let technicianName: string | null = null;
  if (input.technicianId) {
    const tech = await prisma.technician.findUnique({
      where: { id: input.technicianId },
      select: { name: true, isHVCertified: true },
    });
    if (!tech) throw new Error("Selected technician no longer exists");
    if (job.isHV && !tech.isHVCertified)
      throw new Error(
        `Technician "${tech.name}" is not HV-certified — assign a certified technician.`,
      );
    technicianName = tech.name;
  }

  await prisma.jobCard.update({
    where: { id },
    data: {
      bayId: input.bayId || null,
      technicianId: input.technicianId || null,
      technician: technicianName,
    },
  });
}

// Approve an estimate: ESTIMATE → OPEN. No stock/GL impact — that still
// happens only at completion. Stamps who approved and when.
export async function approveJobCard(
  id: string,
  approvedBy?: string,
): Promise<void> {
  const existing = await prisma.jobCard.findUnique({ where: { id } });
  if (!existing) throw new Error("Job Card not found");
  if (existing.status !== "ESTIMATE")
    throw new Error("Only estimates can be approved");
  await prisma.jobCard.update({
    where: { id },
    data: {
      status: "OPEN",
      approvedAt: new Date(),
      approvedBy: approvedBy?.trim() || null,
    },
  });
}

// Management insights for the Job Cards list header.
// Six-month completion trend: counts of jobs completed per calendar month.
function completionsByMonth(
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

export async function jobCardAnalytics(): Promise<JobCardAnalytics> {
  const [grouped, done, open, qcPending, completedRows, techRows, recent] =
    await Promise.all([
      prisma.jobCard.groupBy({ by: ["status"], _count: true }),
      prisma.jobCard.aggregate({
        _sum: { total: true, partsTotal: true, laborTotal: true },
        where: { status: "COMPLETED" },
      }),
      prisma.jobCard.aggregate({
        _sum: { total: true },
        where: { status: "OPEN" },
      }),
      prisma.jobCard.count({ where: { status: "OPEN", qcAt: null } }),
      prisma.jobCard.findMany({
        where: { status: "COMPLETED", completedAt: { not: null } },
        select: { createdAt: true, completedAt: true },
      }),
      prisma.jobCard.findMany({
        select: {
          technician: true,
          technicianRef: { select: { name: true } },
        },
      }),
      prisma.jobCard.findMany({
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          id: true,
          name: true,
          vehicleId: true,
          status: true,
          total: true,
          createdAt: true,
          completedAt: true,
          cancelledAt: true,
          qcAt: true,
          qcBy: true,
          vehicle: { select: { vin: true, model: true } },
        },
      }),
    ]);

  const countFor = (s: "ESTIMATE" | "OPEN" | "COMPLETED" | "CANCELLED") =>
    grouped.find((g) => g.status === s)?._count ?? 0;

  // Average turnaround (hours) across completed jobs.
  let avgTurnaroundHours: number | null = null;
  if (completedRows.length) {
    const totalMs = completedRows.reduce(
      (s, r) => s + (r.completedAt!.getTime() - r.createdAt.getTime()),
      0,
    );
    avgTurnaroundHours =
      Math.round((totalMs / completedRows.length / 3_600_000) * 10) / 10;
  }

  // Jobs by technician (top 6; fall back to free-text name / "Unassigned").
  const techCounts = new Map<string, number>();
  for (const r of techRows) {
    const name = r.technicianRef?.name ?? r.technician?.trim() ?? "";
    const key = name || "Unassigned";
    techCounts.set(key, (techCounts.get(key) ?? 0) + 1);
  }
  const byTechnician = [...techCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Activity feed — derive events from each recent job's timestamps.
  const recentActivity: JobCardActivity[] = recent
    .flatMap((j) => {
      const base = {
        jobId: j.id,
        name: j.name,
        vehicleId: j.vehicleId,
        vin: j.vehicle.vin,
        model: j.vehicle.model,
      };
      const events: JobCardActivity[] = [
        { ...base, id: `${j.id}:OPENED`, kind: "OPENED", at: j.createdAt.toISOString() },
      ];
      if (j.qcAt)
        events.push({
          ...base,
          id: `${j.id}:QC`,
          kind: "QC",
          at: j.qcAt.toISOString(),
          by: j.qcBy,
        });
      if (j.completedAt)
        events.push({
          ...base,
          id: `${j.id}:COMPLETED`,
          kind: "COMPLETED",
          at: j.completedAt.toISOString(),
          amount: Number(j.total),
        });
      if (j.cancelledAt)
        events.push({
          ...base,
          id: `${j.id}:CANCELLED`,
          kind: "CANCELLED",
          at: j.cancelledAt.toISOString(),
        });
      return events;
    })
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);

  return {
    open: countFor("OPEN"),
    completed: countFor("COMPLETED"),
    cancelled: countFor("CANCELLED"),
    revenue: Number(done._sum.total ?? 0),
    partsValue: Number(done._sum.partsTotal ?? 0),
    laborValue: Number(done._sum.laborTotal ?? 0),
    openValue: Number(open._sum.total ?? 0),
    avgTurnaroundHours,
    qcPending,
    byStatus: [
      { name: "Estimate", value: countFor("ESTIMATE") },
      { name: "Open", value: countFor("OPEN") },
      { name: "Completed", value: countFor("COMPLETED") },
      { name: "Cancelled", value: countFor("CANCELLED") },
    ],
    byTechnician,
    completionsByMonth: completionsByMonth(completedRows),
    recentActivity,
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

    // 1) Inventory — issue each part from the service warehouse. Batch-tracked
    //    parts are consumed First-Expiry-First-Out across their lots; any
    //    shortfall beyond batch stock falls back to a plain (unbatched) issue
    //    so the full quantity always leaves stock.
    const partItems = await tx.item.findMany({
      where: { id: { in: job.parts.map((p) => p.itemId) } },
      select: { id: true, hasBatchNo: true, hasSerialNo: true },
    });
    const batchTracked = new Set(
      partItems.filter((i) => i.hasBatchNo).map((i) => i.id),
    );
    const serialTracked = new Set(
      partItems.filter((i) => i.hasSerialNo).map((i) => i.id),
    );

    for (const p of job.parts) {
      let remaining = p.qty;
      if (batchTracked.has(p.itemId)) {
        const { alloc, shortfall } = await allocateFefo(
          tx,
          p.itemId,
          job.warehouseId!,
          p.qty,
        );
        for (const a of alloc) {
          await postStockLedger(tx, {
            itemId: p.itemId,
            warehouseId: job.warehouseId!,
            actualQty: -a.qty,
            voucherType: VT,
            voucherNo: job.name,
            voucherDetailId: p.id,
            postingAt: job.serviceDate,
            batchId: a.batchId,
          });
        }
        remaining = shortfall;
      }
      if (remaining > 1e-9) {
        await postStockLedger(tx, {
          itemId: p.itemId,
          warehouseId: job.warehouseId!,
          actualQty: -remaining,
          voucherType: VT,
          voucherNo: job.name,
          voucherDetailId: p.id,
          postingAt: job.serviceDate,
        });
      }
      // Serial-tracked parts: mark the oldest in-stock units delivered.
      if (serialTracked.has(p.itemId)) {
        await consumeSerials(tx, {
          itemId: p.itemId,
          warehouseId: job.warehouseId!,
          qty: p.qty,
          voucherType: VT,
          voucherNo: job.name,
        });
      }
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
        batchId: s.batchId, // credit the same lot the part was issued from
      });
    }
    await tx.stockLedgerEntry.updateMany({
      where: { voucherType: VT, voucherNo: job.name, isCancelled: false },
      data: { isCancelled: true },
    });

    // Return any serial-tracked units to stock.
    await restoreSerials(tx, { voucherType: VT, voucherNo: job.name });

    // Reverse the GL revenue.
    await reverseGL(tx, VT, job.name, new Date());

    await tx.jobCard.update({
      where: { id: job.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}
