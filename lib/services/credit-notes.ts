import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  ClaimReconOption,
  CreditNoteFormValues,
  CreditNoteRow,
  ReconciliationSummary,
} from "@/modules/dms/reconciliation/schema";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const SORTABLE = ["number", "amount", "noteDate", "status"] as const;

// Re-sync a claim's reimbursed total + its credit notes' match status whenever
// a note is linked, edited, or removed. Credit notes are the authoritative OEM
// payment record, so they drive the claim's reimbursedAmount.
async function syncClaim(
  tx: Prisma.TransactionClient,
  claimId: string | null,
) {
  if (!claimId) return;
  const claim = await tx.warrantyClaim.findUnique({
    where: { id: claimId },
    select: { approvedAmount: true },
  });
  if (!claim) return;
  const notes = await tx.creditNote.findMany({
    where: { claimId },
    select: { id: true, amount: true },
  });
  const total = round2(notes.reduce((s, n) => s + Number(n.amount), 0));
  const approved = Number(claim.approvedAmount);
  const status = total === approved ? "MATCHED" : "DISCREPANCY";
  await tx.warrantyClaim.update({
    where: { id: claimId },
    data: { reimbursedAmount: total },
  });
  if (notes.length > 0)
    await tx.creditNote.updateMany({ where: { claimId }, data: { status } });
}

// Credit notes reconcile OEM payments, so they only attach to a decided claim.
async function assertReconcilable(
  tx: Prisma.TransactionClient,
  claimId: string | null,
) {
  if (!claimId) return;
  const claim = await tx.warrantyClaim.findUnique({
    where: { id: claimId },
    select: { status: true },
  });
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "APPROVED" && claim.status !== "SETTLED")
    throw new Error(
      "Credit notes can only be matched to approved or settled claims.",
    );
}

function toRow(
  n: Prisma.CreditNoteGetPayload<{
    include: { claim: { select: { name: true; approvedAmount: true } } };
  }>,
): CreditNoteRow {
  return {
    id: n.id,
    number: n.number,
    oemRef: n.oemRef,
    amount: Number(n.amount),
    noteDate: n.noteDate.toISOString(),
    status: n.status,
    claimId: n.claimId,
    claimName: n.claim?.name ?? null,
    approvedAmount: n.claim ? Number(n.claim.approvedAmount) : null,
  };
}

const INCLUDE = {
  claim: { select: { name: true, approvedAmount: true } },
} satisfies Prisma.CreditNoteInclude;

export async function listCreditNotes(
  p: ListParams,
  filters: { status?: string },
): Promise<ListResponse<CreditNoteRow>> {
  const where: Prisma.CreditNoteWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as CreditNoteRow["status"];
  if (p.search)
    where.OR = [
      { number: { contains: p.search, mode: "insensitive" } },
      { oemRef: { contains: p.search, mode: "insensitive" } },
      { claim: { name: { contains: p.search, mode: "insensitive" } } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { noteDate: "desc" });
  const [rows, total] = await Promise.all([
    prisma.creditNote.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE,
    }),
    prisma.creditNote.count({ where }),
  ]);
  return { rows: rows.map(toRow), total, page: p.page, limit: p.limit };
}

function toData(v: CreditNoteFormValues) {
  return {
    number: v.number.trim(),
    oemRef: v.oemRef?.trim() || null,
    amount: round2(v.amount),
    noteDate: v.noteDate ? new Date(v.noteDate) : new Date(),
    claimId: v.claimId?.trim() || null,
    notes: v.notes?.trim() || null,
  };
}

export async function createCreditNote(
  v: CreditNoteFormValues,
): Promise<{ id: string }> {
  const data = toData(v);
  const id = await prisma.$transaction(async (tx) => {
    await assertReconcilable(tx, data.claimId);
    const n = await tx.creditNote.create({
      data: { ...data, status: data.claimId ? "MATCHED" : "UNMATCHED" },
    });
    await syncClaim(tx, data.claimId);
    return n.id;
  });
  return { id };
}

export async function updateCreditNote(
  id: string,
  v: CreditNoteFormValues,
): Promise<{ id: string }> {
  const existing = await prisma.creditNote.findUnique({ where: { id } });
  if (!existing) throw new Error("Credit note not found");
  const data = toData(v);
  await prisma.$transaction(async (tx) => {
    await assertReconcilable(tx, data.claimId);
    await tx.creditNote.update({
      where: { id },
      data: { ...data, status: data.claimId ? "MATCHED" : "UNMATCHED" },
    });
    // Re-sync both the old and new claim if the link changed.
    if (existing.claimId && existing.claimId !== data.claimId)
      await syncClaim(tx, existing.claimId);
    await syncClaim(tx, data.claimId);
  });
  return { id };
}

export async function deleteCreditNote(id: string): Promise<void> {
  const existing = await prisma.creditNote.findUnique({ where: { id } });
  if (!existing) throw new Error("Credit note not found");
  await prisma.$transaction(async (tx) => {
    await tx.creditNote.delete({ where: { id } });
    await syncClaim(tx, existing.claimId);
  });
}

export async function matchCreditNote(
  id: string,
  claimId: string | null,
): Promise<void> {
  const existing = await prisma.creditNote.findUnique({ where: { id } });
  if (!existing) throw new Error("Credit note not found");
  await prisma.$transaction(async (tx) => {
    await assertReconcilable(tx, claimId);
    await tx.creditNote.update({
      where: { id },
      data: { claimId, status: claimId ? "MATCHED" : "UNMATCHED" },
    });
    if (existing.claimId && existing.claimId !== claimId)
      await syncClaim(tx, existing.claimId);
    await syncClaim(tx, claimId);
  });
}

// Approved / settled claims available to match a credit note against.
export async function claimReconOptions(): Promise<ClaimReconOption[]> {
  const claims = await prisma.warrantyClaim.findMany({
    where: { status: { in: ["APPROVED", "SETTLED"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      approvedAmount: true,
      reimbursedAmount: true,
      warranty: { select: { vehicle: { select: { vin: true } } } },
    },
  });
  return claims.map((c) => {
    const approved = Number(c.approvedAmount);
    const reimbursed = Number(c.reimbursedAmount);
    return {
      id: c.id,
      name: c.name,
      vehicle: c.warranty.vehicle.vin,
      approvedAmount: approved,
      reimbursedAmount: reimbursed,
      outstanding: Math.max(0, round2(approved - reimbursed)),
    };
  });
}

export async function reconciliationSummary(): Promise<ReconciliationSummary> {
  const [claims, notes] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where: { status: { in: ["APPROVED", "SETTLED"] } },
      select: {
        id: true,
        name: true,
        approvedAmount: true,
        reimbursedAmount: true,
        warranty: { select: { vehicle: { select: { vin: true } } } },
        events: {
          where: { kind: "APPROVED" },
          orderBy: { at: "asc" },
          take: 1,
          select: { at: true },
        },
      },
    }),
    prisma.creditNote.findMany({ include: INCLUDE }),
  ]);

  const now = Date.now();
  let totalApproved = 0;
  let totalReimbursed = 0;

  // A discrepancy is a genuine amount mismatch flagged on a credit note, not a
  // claim that's merely awaiting the rest of its payment.
  const discrepancies = new Set(
    notes.filter((n) => n.status === "DISCREPANCY" && n.claimId).map((n) => n.claimId!),
  ).size;

  const outstanding = claims
    .map((c) => {
      const approved = Number(c.approvedAmount);
      const reimbursed = Number(c.reimbursedAmount);
      totalApproved += approved;
      totalReimbursed += reimbursed;
      const out = Math.max(0, round2(approved - reimbursed));
      const approvedAt = c.events[0]?.at ?? null;
      const days = approvedAt
        ? Math.max(0, Math.floor((now - approvedAt.getTime()) / 86_400_000))
        : 0;
      return {
        id: c.id,
        name: c.name,
        vehicle: c.warranty.vehicle.vin,
        approvedAmount: approved,
        reimbursedAmount: reimbursed,
        outstanding: out,
        daysOutstanding: days,
      };
    })
    .filter((c) => c.outstanding > 0);

  // Payment aging buckets by days since approval.
  const buckets = [
    { bucket: "0–30 days", lo: 0, hi: 30 },
    { bucket: "31–60 days", lo: 31, hi: 60 },
    { bucket: "61–90 days", lo: 61, hi: 90 },
    { bucket: "90+ days", lo: 91, hi: Infinity },
  ];
  const aging = buckets.map((b) => {
    const inB = outstanding.filter(
      (c) => c.daysOutstanding >= b.lo && c.daysOutstanding <= b.hi,
    );
    return {
      bucket: b.bucket,
      count: inB.length,
      amount: round2(inB.reduce((s, c) => s + c.outstanding, 0)),
    };
  });

  // Reimbursement trend — matched credit-note value per month (last 6).
  const months: { key: string; name: string; value: number }[] = [];
  const ref = new Date(now);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleDateString("en-IN", { month: "short" }),
      value: 0,
    });
  }
  for (const n of notes) {
    const d = n.noteDate;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((x) => x.key === key);
    if (m) m.value = round2(m.value + Number(n.amount));
  }

  const unmatched = notes.filter((n) => n.status === "UNMATCHED");

  return {
    totalApproved: round2(totalApproved),
    totalReimbursed: round2(totalReimbursed),
    // Sum of per-claim outstanding (clamped) — consistent with aging / top lists
    // and never negative if a claim is over-reimbursed.
    totalOutstanding: round2(
      outstanding.reduce((s, c) => s + c.outstanding, 0),
    ),
    discrepancies,
    unmatchedNotes: unmatched.length,
    unmatchedValue: round2(unmatched.reduce((s, n) => s + Number(n.amount), 0)),
    aging,
    topOutstanding: outstanding
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 8),
    trend: months.map((m) => ({ name: m.name, value: m.value })),
    recentNotes: notes
      .sort((a, b) => b.noteDate.getTime() - a.noteDate.getTime())
      .slice(0, 8)
      .map(toRow),
  };
}
