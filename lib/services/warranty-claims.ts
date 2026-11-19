import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import { evaluateEligibility } from "@/lib/services/warranty-eligibility";
import { COMPONENT_LABELS } from "@/modules/dms/warranties/schema";
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  type ClaimAnalytics,
  type ClaimDetail,
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
    },
  });
  if (!r) return null;
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
    description: r.description,
    status: r.status,
    claimAmount: Number(r.claimAmount),
    approvedAmount: Number(r.approvedAmount),
    oemRef: r.oemRef,
    eligible: r.eligible,
    eligibilityNote: r.eligibilityNote,
    remarks: r.remarks,
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
      warrantyId: values.warrantyId,
      jobCardId: values.jobCardId || null,
      claimDate: values.claimDate ? new Date(values.claimDate) : new Date(),
      description: values.description?.trim() || null,
      claimAmount: round2(values.claimAmount),
      remarks: values.remarks?.trim() || null,
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
      warrantyId: values.warrantyId,
      jobCardId: values.jobCardId || null,
      claimDate: values.claimDate ? new Date(values.claimDate) : existing.claimDate,
      description: values.description?.trim() || null,
      claimAmount: round2(values.claimAmount),
      remarks: values.remarks?.trim() || null,
    },
  });
  return { id: row.id, name: row.name };
}

export async function deleteClaim(id: string): Promise<void> {
  const existing = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!existing) throw new Error("Claim not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft claims can be deleted");
  await prisma.warrantyClaim.delete({ where: { id } });
}

// Submit to the OEM — runs the eligibility check against coverage period and
// (for battery) the vehicle's State-of-Health, storing the verdict.
export async function submitClaim(id: string): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: {
      warranty: { include: { vehicle: { select: { batterySoH: true } } } },
    },
  });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "DRAFT")
    throw new Error("Only draft claims can be submitted");

  const odometer = claim.jobCardId
    ? (await prisma.jobCard.findUnique({
        where: { id: claim.jobCardId },
        select: { odometer: true },
      }))?.odometer ?? null
    : null;

  const w = claim.warranty;
  const verdict = evaluateEligibility({
    component: w.component,
    startDate: w.startDate,
    months: w.months,
    kmLimit: w.kmLimit,
    soHThreshold: w.soHThreshold,
    status: w.status,
    vehicleSoH: w.vehicle.batterySoH,
    odometerKm: odometer,
    asOf: claim.claimDate,
  });

  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      eligible: verdict.eligible,
      eligibilityNote: verdict.note,
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
  await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAmount:
        body.approvedAmount != null
          ? round2(body.approvedAmount)
          : claim.claimAmount,
      oemRef: body.oemRef?.trim() || claim.oemRef,
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
    data: { status: "REJECTED" },
  });
}

export async function settleClaim(id: string): Promise<void> {
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "APPROVED")
    throw new Error("Only approved claims can be settled");
  await prisma.warrantyClaim.update({
    where: { id },
    data: { status: "SETTLED", settledAt: new Date() },
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
