import { describe, it, expect, beforeEach } from "vitest";
import {
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  matchCreditNote,
  reconciliationSummary,
  claimReconOptions,
} from "@/lib/services/credit-notes";
import {
  createClaim,
  submitClaim,
  approveClaim,
  getClaim,
  reimburseClaim,
} from "@/lib/services/warranty-claims";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function approvedClaim(approved: number) {
  const v = await makeVehicle(`VIN-${Math.round(approved)}`, { batterySoH: 70 });
  const w = await prisma.warranty.create({
    data: {
      vehicleId: v.id,
      component: "BATTERY",
      startDate: new Date("2026-01-01"),
      months: 96,
      status: "ACTIVE",
    },
  });
  const { id } = await createClaim({
    warrantyId: w.id,
    claimDate: "2026-06-01",
    claimAmount: approved,
    description: "x",
  });
  await submitClaim(id);
  await approveClaim(id, { approvedAmount: approved });
  return id;
}

describe("reimbursement reconciliation", () => {
  beforeEach(resetDb);

  it("a matching credit note fully reconciles the claim", async () => {
    const claimId = await approvedClaim(50000);
    await createCreditNote({ number: "CN-1", amount: 50000, claimId });

    const c = await getClaim(claimId);
    expect(c?.reimbursedAmount).toBe(50000);
    expect(c?.outstanding).toBe(0);
    expect(c?.creditNotes[0].status).toBe("MATCHED");
  });

  it("a short credit note flags a discrepancy + leaves outstanding", async () => {
    const claimId = await approvedClaim(50000);
    await createCreditNote({ number: "CN-2", amount: 30000, claimId });

    const c = await getClaim(claimId);
    expect(c?.reimbursedAmount).toBe(30000);
    expect(c?.outstanding).toBe(20000);
    expect(c?.creditNotes[0].status).toBe("DISCREPANCY");
  });

  it("matching / unmatching re-syncs the claim", async () => {
    const claimId = await approvedClaim(40000);
    const { id } = await createCreditNote({ number: "CN-3", amount: 40000 });
    // created unmatched
    let c = await getClaim(claimId);
    expect(c?.reimbursedAmount).toBe(0);

    await matchCreditNote(id, claimId);
    c = await getClaim(claimId);
    expect(c?.reimbursedAmount).toBe(40000);
    expect(c?.outstanding).toBe(0);

    await matchCreditNote(id, null);
    c = await getClaim(claimId);
    expect(c?.reimbursedAmount).toBe(0);
    expect(c?.outstanding).toBe(40000);
  });

  it("deleting a credit note restores the outstanding", async () => {
    const claimId = await approvedClaim(25000);
    const { id } = await createCreditNote({ number: "CN-4", amount: 25000, claimId });
    expect((await getClaim(claimId))?.outstanding).toBe(0);
    await deleteCreditNote(id);
    expect((await getClaim(claimId))?.outstanding).toBe(25000);
  });

  it("editing the amount re-evaluates the match status", async () => {
    const claimId = await approvedClaim(60000);
    const { id } = await createCreditNote({ number: "CN-5", amount: 60000, claimId });
    expect((await getClaim(claimId))?.creditNotes[0].status).toBe("MATCHED");
    await updateCreditNote(id, { number: "CN-5", amount: 55000, claimId });
    const c = await getClaim(claimId);
    expect(c?.creditNotes[0].status).toBe("DISCREPANCY");
    expect(c?.outstanding).toBe(5000);
  });

  it("summary totals approved / reimbursed / outstanding + aging + options", async () => {
    const a = await approvedClaim(50000);
    const b = await approvedClaim(30000);
    await createCreditNote({ number: "CN-A", amount: 50000, claimId: a });
    await createCreditNote({ number: "CN-B", amount: 10000, claimId: b });

    const s = await reconciliationSummary();
    expect(s.totalApproved).toBe(80000);
    expect(s.totalReimbursed).toBe(60000);
    expect(s.totalOutstanding).toBe(20000);
    // claim B still has 20k outstanding → one discrepancy
    expect(s.discrepancies).toBe(1);
    expect(s.topOutstanding[0].outstanding).toBe(20000);
    expect(s.aging.reduce((n, x) => n + x.count, 0)).toBe(1);

    const opts = await claimReconOptions();
    expect(opts.length).toBe(2);
  });

  it("tracks an unmatched credit note in the summary", async () => {
    await createCreditNote({ number: "CN-U", amount: 12000 });
    const s = await reconciliationSummary();
    expect(s.unmatchedNotes).toBe(1);
    expect(s.unmatchedValue).toBe(12000);
  });

  it("won't match a credit note to a non-decided (draft) claim", async () => {
    const v = await makeVehicle("VIN-DRAFT", { batterySoH: 70 });
    const w = await prisma.warranty.create({
      data: {
        vehicleId: v.id,
        component: "BATTERY",
        startDate: new Date("2026-01-01"),
        months: 96,
        status: "ACTIVE",
      },
    });
    const { id } = await createClaim({
      warrantyId: w.id,
      claimDate: "2026-06-01",
      claimAmount: 10000,
    });
    await expect(
      createCreditNote({ number: "CN-DRAFT", amount: 10000, claimId: id }),
    ).rejects.toThrow(/approved or settled/i);
  });

  it("blocks manual reimbursement once a claim has credit notes", async () => {
    const claimId = await approvedClaim(40000);
    await createCreditNote({ number: "CN-M", amount: 40000, claimId });
    await expect(reimburseClaim(claimId, { amount: 1000 })).rejects.toThrow(
      /credit notes/i,
    );
  });
});
