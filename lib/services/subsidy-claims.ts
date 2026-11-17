import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  SubsidyClaimDetail,
  SubsidyClaimFormValues,
  SubsidyClaimListItem,
} from "@/modules/dms/subsidy-claims/schema";

const SORTABLE = ["name", "customerName", "claimAmount", "status"] as const;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const INCLUDE = {
  scheme: { select: { code: true, name: true } },
  vehicle: { select: { vin: true } },
} as const;

export async function listSubsidyClaims(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<SubsidyClaimListItem>> {
  const where: Prisma.SubsidyClaimWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as Prisma.SubsidyClaimWhereInput["status"];
  if (p.search)
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { customerName: { contains: p.search, mode: "insensitive" } },
      { vehicle: { vin: { contains: p.search, mode: "insensitive" } } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.subsidyClaim.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE,
    }),
    prisma.subsidyClaim.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      scheme: r.scheme.code,
      vehicle: r.vehicle.vin,
      customerName: r.customerName,
      claimAmount: Number(r.claimAmount),
      kycVerified: r.kycVerified,
      status: r.status,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function getSubsidyClaim(
  id: string,
): Promise<SubsidyClaimDetail | null> {
  const r = await prisma.subsidyClaim.findUnique({
    where: { id },
    include: INCLUDE,
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    schemeId: r.schemeId,
    scheme: `${r.scheme.code} · ${r.scheme.name}`,
    vehicleId: r.vehicleId,
    vehicle: r.vehicle.vin,
    customerName: r.customerName,
    kycDocType: r.kycDocType,
    kycRef: r.kycRef,
    kycDocUrl: r.kycDocUrl,
    kycVerified: r.kycVerified,
    claimAmount: Number(r.claimAmount),
    status: r.status,
    voucherNo: r.voucherNo,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    disbursedAt: r.disbursedAt ? r.disbursedAt.toISOString() : null,
    remarks: r.remarks,
  };
}

function toData(v: SubsidyClaimFormValues) {
  return {
    schemeId: v.schemeId,
    vehicleId: v.vehicleId,
    customerName: v.customerName.trim(),
    kycDocType: v.kycDocType?.trim() || null,
    kycRef: v.kycRef?.trim() || null,
    kycDocUrl: v.kycDocUrl?.trim() || null,
    kycVerified: v.kycVerified,
    claimAmount: round2(v.claimAmount),
    remarks: v.remarks?.trim() || null,
  };
}

export async function createSubsidyClaim(
  values: SubsidyClaimFormValues,
): Promise<{ id: string; name: string }> {
  const year = new Date().getFullYear();
  const count = await prisma.subsidyClaim.count();
  const name = `SUB-${year}-${String(count + 1).padStart(5, "0")}`;
  const row = await prisma.subsidyClaim.create({
    data: { name, ...toData(values) },
  });
  return { id: row.id, name };
}

export async function updateSubsidyClaim(
  id: string,
  values: SubsidyClaimFormValues,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!existing) throw new Error("Subsidy claim not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft claims can be edited");
  const row = await prisma.subsidyClaim.update({
    where: { id },
    data: toData(values),
  });
  return { id: row.id, name: row.name };
}

export async function deleteSubsidyClaim(id: string): Promise<void> {
  const existing = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!existing) throw new Error("Subsidy claim not found");
  if (existing.status !== "DRAFT")
    throw new Error("Only draft claims can be deleted");
  await prisma.subsidyClaim.delete({ where: { id } });
}

// Submit to the authority — KYC must be verified first.
export async function submitSubsidyClaim(id: string): Promise<void> {
  const claim = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Subsidy claim not found");
  if (claim.status !== "DRAFT")
    throw new Error("Only draft claims can be submitted");
  if (!claim.kycVerified)
    throw new Error("Verify the customer's KYC before submitting.");
  await prisma.subsidyClaim.update({
    where: { id },
    data: { status: "SUBMITTED" },
  });
}

// Approve — generate the e-voucher number.
export async function approveSubsidyClaim(id: string): Promise<void> {
  const claim = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Subsidy claim not found");
  if (claim.status !== "SUBMITTED")
    throw new Error("Only submitted claims can be approved");
  await prisma.subsidyClaim.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      voucherNo: claim.voucherNo ?? claim.name.replace(/^SUB-/, "EVCH-"),
    },
  });
}

export async function disburseSubsidyClaim(id: string): Promise<void> {
  const claim = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Subsidy claim not found");
  if (claim.status !== "APPROVED")
    throw new Error("Only approved claims can be disbursed");
  await prisma.subsidyClaim.update({
    where: { id },
    data: { status: "DISBURSED", disbursedAt: new Date() },
  });
}

export async function rejectSubsidyClaim(id: string): Promise<void> {
  const claim = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Subsidy claim not found");
  if (claim.status !== "SUBMITTED")
    throw new Error("Only submitted claims can be rejected");
  await prisma.subsidyClaim.update({
    where: { id },
    data: { status: "REJECTED" },
  });
}

export async function cancelSubsidyClaim(id: string): Promise<void> {
  const claim = await prisma.subsidyClaim.findUnique({ where: { id } });
  if (!claim) throw new Error("Subsidy claim not found");
  if (claim.status !== "DRAFT" && claim.status !== "SUBMITTED")
    throw new Error("Only draft or submitted claims can be cancelled");
  await prisma.subsidyClaim.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
