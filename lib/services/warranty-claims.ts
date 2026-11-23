import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import {
  evaluateEligibilityReport,
  type EligibilityReportInput,
} from "@/lib/services/warranty-eligibility";
import { COMPONENT_LABELS } from "@/modules/dms/warranties/schema";
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  type ClaimAnalytics,
  type ClaimDetail,
  type ClaimEligibility,
  type ClaimFormValues,
  type ClaimListItem,
} from "@/modules/dms/warranty-claims/schema";

const SORTABLE = ["name", "claimDate", "claimAmount", "status"] as const;

// Management insights for the Warranty Claims list header.
export async function warrantyClaimAnalytics(): Promise<ClaimAnalytics> {
  const [grouped, claimed, approved] = await Promise.all([
    prisma.warrantyClaim.groupBy({ by: ["status"], _count: true }),
    prisma.warrantyClaim.aggregate({
      _sum: { claimAmount: true },
      where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
    }),
    prisma.warrantyClaim.aggregate({
      _sum: { approvedAmount: true },
      where: { status: { in: ["APPROVED", "SETTLED"] } },
    }),
  ]);
  const countFor = (s: string) =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  return {
    open: countFor("DRAFT") + countFor("SUBMITTED"),
    approved: countFor("APPROVED"),
    settled: countFor("SETTLED"),
    claimedValue: Number(claimed._sum.claimAmount ?? 0),
    approvedValue: Number(approved._sum.approvedAmount ?? 0),
    byStatus: CLAIM_STATUSES.map((s) => ({
      name: CLAIM_STATUS_LABELS[s],
      value: countFor(s),
    })),
  };
}
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

async function jobCardName(id: string | null) {
  if (!id) return null;
  const j = await prisma.jobCard.findUnique({
    where: { id },
    select: { name: true },
  });
  return j?.name ?? null;
}

export async function listClaims(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<ClaimListItem>> {
  const where: Prisma.WarrantyClaimWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as Prisma.WarrantyClaimWhereInput["status"];
  if (p.search)
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      {
        warranty: {
          vehicle: { vin: { contains: p.search, mode: "insensitive" } },
        },
      },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { claimDate: "desc" });

  const [rows, total] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: {
        warranty: {
          select: { component: true, vehicle: { select: { vin: true } } },
        },
      },
    }),
    prisma.warrantyClaim.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      vehicle: r.warranty.vehicle.vin,
      component: COMPONENT_LABELS[r.warranty.component],
      status: r.status,
      claimDate: r.claimDate.toISOString(),
      claimAmount: Number(r.claimAmount),
      eligible: r.eligible,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getClaim(id: string): Promise<ClaimDetail | null> {
  const r = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: {
      warranty: {
        select: {
          component: true,
          vehicleId: true,
          vehicle: { select: { vin: true } },
        },
      },
      events: { orderBy: { at: "desc" } },
      creditNotes: { orderBy: { noteDate: "desc" } },
    },
  });
  if (!r) return null;
  const approved = Number(r.approvedAmount);
  const reimbursed = Number(r.reimbursedAmount);
  return {
    id: r.id,
    name: r.name,
    warrantyId: r.warrantyId,
    warrantyLabel: `${r.warranty.vehicle.vin} · ${COMPONENT_LABELS[r.warranty.component]}`,
    component: COMPONENT_LABELS[r.warranty.component],
    vehicleId: r.warranty.vehicleId,
    vehicle: r.warranty.vehicle.vin,
    jobCardId: r.jobCardId,
    jobCard: await jobCardName(r.jobCardId),
    claimDate: r.claimDate.toISOString(),
    faultCode: r.faultCode,
    laborCode: r.laborCode,
    diagnosis: r.diagnosis,
    partsNeeded: r.partsNeeded,
    evidence: r.evidence,
    documents: r.documents,
    description: r.description,
    status: r.status,
    claimAmount: Number(r.claimAmount),
    approvedAmount: approved,
    reimbursedAmount: reimbursed,
    outstanding:
      r.status === "APPROVED" || r.status === "SETTLED"
        ? Math.max(0, round2(approved - reimbursed))
        : 0,
    oemRef: r.oemRef,
    expectedReimburseAt: r.expectedReimburseAt
      ? r.expectedReimburseAt.toISOString()
      : null,
    submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
    settledAt: r.settledAt ? r.settledAt.toISOString() : null,
    eligible: r.eligible,
    eligibilityNote: r.eligibilityNote,
    remarks: r.remarks,
    events: r.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      note: e.note,
      by: e.by,
      at: e.at.toISOString(),
    })),
    creditNotes: r.creditNotes.map((c) => ({
      id: c.id,
      number: c.number,
      amount: Number(c.amount),
      noteDate: c.noteDate.toISOString(),
      status: c.status,
    })),
  };
}

function toClaimData(v: ClaimFormValues) {
  return {
    warrantyId: v.warrantyId,
    jobCardId: v.jobCardId || null,
    faultCode: v.faultCode?.trim() || null,
    laborCode: v.laborCode?.trim() || null,
    diagnosis: v.diagnosis?.trim() || null,
    partsNeeded: v.partsNeeded?.trim() || null,
    evidence: (v.evidence ?? []).map((s) => s.trim()).filter(Boolean),
    documents: (v.documents ?? []).map((s) => s.trim()).filter(Boolean),
    description: v.description?.trim() || null,
    claimAmount: round2(v.claimAmount),
    expectedReimburseAt: v.expectedReimburseAt
      ? new Date(v.expectedReimburseAt)
      : null,
    remarks: v.remarks?.trim() || null,
  };
}

export async function createClaim(
  values: ClaimFormValues,
): Promise<{ id: string; name: string }> {
  const year = new Date().getFullYear();
  const count = await prisma.warrantyClaim.count();
  const name = `WCLM-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.warrantyClaim.create({
    data: {
      name,
      ...toClaimData(values),
      claimDate: values.claimDate ? new Date(values.claimDate) : new Date(),
      events: { create: { kind: "CREATED", note: "Claim drafted" } },
    },
  });
  return { id: row.id, name };
}

export async function updateClaim(
  id: string,
  values: ClaimFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!existing) throw new Error("Claim not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft claims can be edited");
  const row = await prisma.warrantyClaim.update({
    where: { id },
    data: {
      ...toClaimData(values),
      claimDate: values.claimDate ? new Date(values.claimDate) : existing.claimDate,
    },
  });
  return { id: row.id, name: row.name };
}

// Add an OEM reviewer comment or an internal note to the claim's timeline.
export async function addClaimEvent(
  id: string,
  body: { kind?: "COMMENT" | "NOTE"; note: string; by?: string | null },
): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  const note = body.note?.trim();
  if (!note) throw new Error("A note is required");
  await prisma.claimEvent.create({
    data: { claimId: id, kind: body.kind ?? "COMMENT", note, by: body.by ?? null },
  });
}

// Record an OEM reimbursement against an approved/settled claim.
export async function reimburseClaim(
  id: string,
  body: { amount: number; by?: string | null },
): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "APPROVED" && claim.status !== "SETTLED")
    throw new Error("Only approved or settled claims can be reimbursed");
  const amount = round2(body.amount);
  await prisma.$transaction([
    prisma.warrantyClaim.update({
      where: { id },
      data: { reimbursedAmount: round2(Number(claim.reimbursedAmount) + amount) },
    }),
    prisma.claimEvent.create({
      data: {
        claimId: id,
        kind: "REIMBURSED",
        note: `OEM reimbursed ₹${amount.toLocaleString("en-IN")}`,
        by: body.by ?? null,
      },
    }),
  ]);
}

// Pre-populate a new claim from a job card: fault/diagnosis, parts, cost, photos.
export async function claimDefaultsFromJob(jobCardId: string) {
  const job = await prisma.jobCard.findUnique({
    where: { id: jobCardId },
    select: {
      id: true,
      name: true,
      vehicleId: true,
      complaint: true,
      total: true,
      photos: true,
      parts: { select: { itemId: true, qty: true } },
    },
  });
  if (!job) return null;
  const itemIds = [...new Set(job.parts.map((p) => p.itemId))];
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, itemName: true },
      })
    : [];
  const itemName = new Map(items.map((i) => [i.id, i.itemName]));
  // Suggest an active warranty on the same vehicle (battery first, else any).
  const warranties = await prisma.warranty.findMany({
    where: { vehicleId: job.vehicleId, status: "ACTIVE" },
    select: { id: true, component: true },
  });
  const warrantyId =
    warranties.find((w) => w.component === "BATTERY")?.id ??
    warranties[0]?.id ??
    null;
  const partsNeeded =
    job.parts.length > 0
      ? job.parts
          .map((p) => `${itemName.get(p.itemId) ?? "Part"} ×${p.qty}`)
          .join(", ")
      : null;
  return {
    jobCardId: job.id,
    jobCard: job.name,
    warrantyId,
    faultCode: null,
    diagnosis: job.complaint ?? null,
    partsNeeded,
    description: job.complaint ?? null,
    claimAmount: Number(job.total),
    photos: job.photos ?? [],
  };
}

export async function deleteClaim(id: string): Promise<void> {
  const existing = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!existing) throw new Error("Claim not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft claims can be deleted");
  await prisma.warrantyClaim.delete({ where: { id } });
}

// Gather everything the automated eligibility check needs for one claim:
// coverage terms, the vehicle's SoH, the odometer + last-service date from its
// job history, and the reported fault code.
async function eligibilityContext(claimId: string) {
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id: claimId },
    include: {
      warranty: {
        include: {
          vehicle: {
            select: { id: true, vin: true, model: true, batterySoH: true, customerName: true },
          },
        },
      },
    },
  });
  if (!claim) return null;

  const w = claim.warranty;

  // Odometer: prefer the claim's job card, else the latest reading for the car.
  const claimJob = claim.jobCardId
    ? await prisma.jobCard.findUnique({
        where: { id: claim.jobCardId },
        select: { id: true, name: true, serviceDate: true, odometer: true },
      })
    : null;

  const latestOdo = await prisma.jobCard.findFirst({
    where: { vehicleId: w.vehicleId, odometer: { not: null } },
    orderBy: { serviceDate: "desc" },
    select: { odometer: true },
  });
  const odometerKm = claimJob?.odometer ?? latestOdo?.odometer ?? null;

  // Last service: most recent job card for the vehicle (any status).
  const lastService = await prisma.jobCard.findFirst({
    where: { vehicleId: w.vehicleId },
    orderBy: { serviceDate: "desc" },
    select: { serviceDate: true },
  });

  const input: EligibilityReportInput = {
    component: w.component,
    startDate: w.startDate,
    months: w.months,
    kmLimit: w.kmLimit,
    soHThreshold: w.soHThreshold,
    status: w.status,
    vehicleSoH: w.vehicle.batterySoH,
    odometerKm,
    faultCode: claim.faultCode,
    lastServiceAt: lastService?.serviceDate ?? null,
    asOf: claim.claimDate,
  };

  return { claim, w, claimJob, odometerKm, lastService, input };
}

// Standalone pre-check: run the eligibility report for a warranty + fault code +
// odometer, without needing a claim. Used by the eligibility check tool.
export async function previewEligibility(p: {
  warrantyId: string;
  faultCode?: string | null;
  odometerKm?: number | null;
}): Promise<ClaimEligibility | null> {
  const w = await prisma.warranty.findUnique({
    where: { id: p.warrantyId },
    include: {
      vehicle: {
        select: { id: true, vin: true, model: true, batterySoH: true, customerName: true },
      },
    },
  });
  if (!w) return null;

  const latestOdo =
    p.odometerKm == null
      ? (
          await prisma.jobCard.findFirst({
            where: { vehicleId: w.vehicleId, odometer: { not: null } },
            orderBy: { serviceDate: "desc" },
            select: { odometer: true },
          })
        )?.odometer ?? null
      : p.odometerKm;

  const lastService = await prisma.jobCard.findFirst({
    where: { vehicleId: w.vehicleId },
    orderBy: { serviceDate: "desc" },
    select: { serviceDate: true },
  });

  const report = evaluateEligibilityReport({
    component: w.component,
    startDate: w.startDate,
    months: w.months,
    kmLimit: w.kmLimit,
    soHThreshold: w.soHThreshold,
    status: w.status,
    vehicleSoH: w.vehicle.batterySoH,
    odometerKm: latestOdo,
    faultCode: p.faultCode,
    lastServiceAt: lastService?.serviceDate ?? null,
  });
  const expiry = new Date(w.startDate);
  expiry.setMonth(expiry.getMonth() + w.months);

  return {
    eligible: report.eligible,
    preQualified: report.preQualified,
    note: report.note,
    checks: report.checks,
    coverage: {
      component: COMPONENT_LABELS[w.component],
      startDate: w.startDate.toISOString(),
      expiryDate: expiry.toISOString(),
      months: w.months,
      kmLimit: w.kmLimit,
      soHThreshold: w.soHThreshold,
      status: w.status,
    },
    vehicle: {
      id: w.vehicle.id,
      vin: w.vehicle.vin,
      model: w.vehicle.model,
      batterySoH: w.vehicle.batterySoH,
      odometerKm: latestOdo,
      customerName: w.vehicle.customerName,
    },
    job: null,
    faultCode: p.faultCode?.trim() || null,
    lastServiceAt: lastService?.serviceDate.toISOString() ?? null,
  };
}

// The full automated eligibility report for the claim detail / check page.
export async function getClaimEligibility(
  id: string,
): Promise<ClaimEligibility | null> {
  const ctx = await eligibilityContext(id);
  if (!ctx) return null;
  const { claim, w, claimJob, odometerKm, lastService, input } = ctx;
  const report = evaluateEligibilityReport(input);
  const expiry = new Date(w.startDate);
  expiry.setMonth(expiry.getMonth() + w.months);

  return {
    eligible: report.eligible,
    preQualified: report.preQualified,
    note: report.note,
    checks: report.checks,
    coverage: {
      component: COMPONENT_LABELS[w.component],
      startDate: w.startDate.toISOString(),
      expiryDate: expiry.toISOString(),
      months: w.months,
      kmLimit: w.kmLimit,
      soHThreshold: w.soHThreshold,
      status: w.status,
    },
    vehicle: {
      id: w.vehicle.id,
      vin: w.vehicle.vin,
      model: w.vehicle.model,
      batterySoH: w.vehicle.batterySoH,
      odometerKm,
      customerName: w.vehicle.customerName,
    },
    job: claimJob
      ? {
          id: claimJob.id,
          name: claimJob.name,
          serviceDate: claimJob.serviceDate.toISOString(),
          odometer: claimJob.odometer,
        }
      : null,
    faultCode: claim.faultCode,
    lastServiceAt: lastService?.serviceDate.toISOString() ?? null,
  };
}

// Submit to the OEM — runs the full eligibility report and stores the verdict
// plus the structured per-check breakdown.
export async function submitClaim(id: string): Promise<void> {
  const ctx = await eligibilityContext(id);
  if (!ctx) throw new Error("Claim not found");
  if (ctx.claim.status !== "DRAFT")
    throw new Error("Only draft claims can be submitted");

  const report = evaluateEligibilityReport(ctx.input);

  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      eligible: report.eligible,
      eligibilityNote: report.note,
      eligibilityChecks: report.checks,
      events: {
        create: {
          kind: "SUBMITTED",
          note: `Submitted to OEM — ${report.eligible ? "eligible" : "not eligible"}: ${report.note}`,
        },
      },
    },
  });
}

export async function approveClaim(
  id: string,
  body: { approvedAmount?: number; oemRef?: string },
): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "SUBMITTED")
    throw new Error("Only submitted claims can be approved");
  const approved =
    body.approvedAmount != null
      ? round2(body.approvedAmount)
      : Number(claim.claimAmount);
  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAmount: approved,
      oemRef: body.oemRef?.trim() || claim.oemRef,
      events: {
        create: {
          kind: "APPROVED",
          note: `Approved for ₹${approved.toLocaleString("en-IN")}${body.oemRef ? ` · OEM ${body.oemRef.trim()}` : ""}`,
        },
      },
    },
  });
}

export async function rejectClaim(id: string): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "SUBMITTED")
    throw new Error("Only submitted claims can be rejected");
  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "REJECTED",
      events: { create: { kind: "REJECTED", note: "Rejected by OEM" } },
    },
  });
}

export async function settleClaim(id: string): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "APPROVED")
    throw new Error("Only approved claims can be settled");
  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "SETTLED",
      settledAt: new Date(),
      events: { create: { kind: "SETTLED", note: "Marked settled" } },
    },
  });
}

export async function cancelClaim(id: string): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "DRAFT" && claim.status !== "SUBMITTED")
    throw new Error("Only draft or submitted claims can be cancelled");
  await prisma.warrantyClaim.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
