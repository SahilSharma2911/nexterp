import { describe, it, expect, beforeEach } from "vitest";
import {
  createClaim,
  submitClaim,
  approveClaim,
  rejectClaim,
  settleClaim,
  cancelClaim,
  getClaim,
  addClaimEvent,
  reimburseClaim,
} from "@/lib/services/warranty-claims";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function setup(soH: number | null, threshold: number | null) {
  const v = await makeVehicle("VIN-C", soH == null ? {} : { batterySoH: soH });
  const w = await prisma.warranty.create({
    data: {
      vehicleId: v.id,
      component: "BATTERY",
      startDate: new Date("2026-01-01"),
      months: 96,
      soHThreshold: threshold,
      status: "ACTIVE",
    },
  });
  return { vehicleId: v.id, warrantyId: w.id };
}

const claimForm = (warrantyId: string) => ({
  warrantyId,
  jobCardId: "",
  claimDate: "2026-06-01",
  description: "battery degraded",
  claimAmount: 50000,
  remarks: "",
});

describe("warranty claims service", () => {
  beforeEach(resetDb);

  it("submit marks NOT eligible when battery SoH is above the threshold", async () => {
    const { warrantyId } = await setup(90, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await submitClaim(id);
    const c = await getClaim(id);
    expect(c?.status).toBe("SUBMITTED");
    expect(c?.eligible).toBe(false);
  });

  it("submit marks eligible when battery SoH is below the threshold", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await submitClaim(id);
    expect((await getClaim(id))?.eligible).toBe(true);
  });

  it("runs the full OEM workflow: submit → approve → settle", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await submitClaim(id);
    await approveClaim(id, { approvedAmount: 45000, oemRef: "OEM-9" });
    let c = await getClaim(id);
    expect(c?.status).toBe("APPROVED");
    expect(c?.approvedAmount).toBe(45000);
    expect(c?.oemRef).toBe("OEM-9");
    await settleClaim(id);
    expect((await getClaim(id))?.status).toBe("SETTLED");
  });

  it("rejects from submitted and guards illegal transitions", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await expect(approveClaim(id, {})).rejects.toThrow(/submitted/i); // can't approve a draft
    await submitClaim(id);
    await rejectClaim(id);
    expect((await getClaim(id))?.status).toBe("REJECTED");
    await expect(settleClaim(id)).rejects.toThrow(/approved/i);
  });

  it("cancels a draft claim", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await cancelClaim(id);
    expect((await getClaim(id))?.status).toBe("CANCELLED");
  });

  it("builds an OEM tracking timeline across the workflow", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await addClaimEvent(id, { kind: "COMMENT", note: "OEM asked for photos", by: "Reviewer" });
    await submitClaim(id);
    await approveClaim(id, { approvedAmount: 45000 });

    const c = await getClaim(id);
    const kinds = c!.events.map((e) => e.kind);
    // newest-first
    expect(kinds).toEqual(["APPROVED", "SUBMITTED", "COMMENT", "CREATED"]);
    expect(c!.events.find((e) => e.kind === "COMMENT")?.by).toBe("Reviewer");
  });

  it("records reimbursement and tracks outstanding", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await submitClaim(id);
    await approveClaim(id, { approvedAmount: 50000 });

    let c = await getClaim(id);
    expect(c?.outstanding).toBe(50000);

    await reimburseClaim(id, { amount: 30000 });
    c = await getClaim(id);
    expect(c?.reimbursedAmount).toBe(30000);
    expect(c?.outstanding).toBe(20000);
    expect(c?.events.some((e) => e.kind === "REIMBURSED")).toBe(true);
  });

  it("won't reimburse a draft claim", async () => {
    const { warrantyId } = await setup(72, 80);
    const { id } = await createClaim(claimForm(warrantyId));
    await expect(reimburseClaim(id, { amount: 100 })).rejects.toThrow(/approved or settled/i);
  });
});
