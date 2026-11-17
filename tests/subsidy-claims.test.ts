import { describe, it, expect, beforeEach } from "vitest";
import {
  createSubsidyClaim,
  updateSubsidyClaim,
  submitSubsidyClaim,
  approveSubsidyClaim,
  disburseSubsidyClaim,
  rejectSubsidyClaim,
  cancelSubsidyClaim,
  getSubsidyClaim,
} from "@/lib/services/subsidy-claims";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function setup() {
  const scheme = await prisma.subsidyScheme.create({
    data: { code: "FAME-II", name: "FAME-II", amount: 150000, status: "ACTIVE" },
  });
  const v = await makeVehicle("VIN-SUB");
  return { schemeId: scheme.id, vehicleId: v.id };
}

const form = (
  schemeId: string,
  vehicleId: string,
  over: Record<string, unknown> = {},
) => ({
  schemeId,
  vehicleId,
  customerName: "Anita K",
  kycDocType: "Aadhaar",
  kycRef: "XXXX-1234",
  kycVerified: false,
  claimAmount: 150000,
  remarks: "",
  ...over,
});

describe("subsidy claims service", () => {
  beforeEach(resetDb);

  it("blocks submit until KYC is verified", async () => {
    const { schemeId, vehicleId } = await setup();
    const { id } = await createSubsidyClaim(form(schemeId, vehicleId));
    await expect(submitSubsidyClaim(id)).rejects.toThrow(/kyc/i);
  });

  it("submits once KYC is verified, generates an e-voucher on approval, then disburses", async () => {
    const { schemeId, vehicleId } = await setup();
    const { id, name } = await createSubsidyClaim(form(schemeId, vehicleId));
    await updateSubsidyClaim(id, form(schemeId, vehicleId, { kycVerified: true }));
    await submitSubsidyClaim(id);
    expect((await getSubsidyClaim(id))?.status).toBe("SUBMITTED");

    await approveSubsidyClaim(id);
    const approved = await getSubsidyClaim(id);
    expect(approved?.status).toBe("APPROVED");
    expect(approved?.voucherNo).toBe(name.replace(/^SUB-/, "EVCH-"));

    await disburseSubsidyClaim(id);
    const done = await getSubsidyClaim(id);
    expect(done?.status).toBe("DISBURSED");
  });

  it("guards illegal transitions", async () => {
    const { schemeId, vehicleId } = await setup();
    const { id } = await createSubsidyClaim(
      form(schemeId, vehicleId, { kycVerified: true }),
    );
    await expect(approveSubsidyClaim(id)).rejects.toThrow(/submitted/i); // draft can't approve
    await expect(disburseSubsidyClaim(id)).rejects.toThrow(/approved/i);
    await submitSubsidyClaim(id);
    await rejectSubsidyClaim(id);
    expect((await getSubsidyClaim(id))?.status).toBe("REJECTED");
  });

  it("stores the KYC document url", async () => {
    const { schemeId, vehicleId } = await setup();
    const { id } = await createSubsidyClaim(
      form(schemeId, vehicleId, { kycDocUrl: "/uploads/kyc.png" }),
    );
    expect((await getSubsidyClaim(id))?.kycDocUrl).toBe("/uploads/kyc.png");
  });

  it("cancels a draft claim", async () => {
    const { schemeId, vehicleId } = await setup();
    const { id } = await createSubsidyClaim(form(schemeId, vehicleId));
    await cancelSubsidyClaim(id);
    expect((await getSubsidyClaim(id))?.status).toBe("CANCELLED");
  });
});
