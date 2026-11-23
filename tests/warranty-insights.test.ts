import { describe, it, expect, beforeEach } from "vitest";
import { warrantyInsights } from "@/lib/services/warranty-insights";
import {
  createClaim,
  submitClaim,
  approveClaim,
  rejectClaim,
} from "@/lib/services/warranty-claims";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function batteryWarranty(vin: string, soH: number, model = "Volt City") {
  const v = await makeVehicle(vin, { model, batterySoH: soH });
  const w = await prisma.warranty.create({
    data: {
      vehicleId: v.id,
      component: "BATTERY",
      startDate: new Date("2026-01-01"),
      months: 96,
      soHThreshold: 70,
      status: "ACTIVE",
    },
  });
  return { vehicleId: v.id, warrantyId: w.id };
}

describe("warranty insights", () => {
  beforeEach(resetDb);

  it("computes rejection rate, fault codes, and model frequency", async () => {
    const a = await batteryWarranty("VIN-A", 65);
    const b = await batteryWarranty("VIN-B", 68);

    const c1 = await createClaim({
      warrantyId: a.warrantyId,
      claimDate: "2026-06-01",
      faultCode: "BMS-1",
      claimAmount: 40000,
    });
    await submitClaim(c1.id);
    await approveClaim(c1.id, { approvedAmount: 40000 });

    const c2 = await createClaim({
      warrantyId: b.warrantyId,
      claimDate: "2026-06-05",
      faultCode: "BMS-1",
      claimAmount: 20000,
    });
    await submitClaim(c2.id);
    await rejectClaim(c2.id);

    const ins = await warrantyInsights();
    expect(ins.totalClaims).toBe(2);
    // 1 rejected of 2 decided = 50%
    expect(ins.rejectionRate).toBe(50);
    expect(ins.approvalRate).toBe(50);
    expect(ins.topFaultCodes[0]).toEqual({ name: "BMS-1", value: 2 });
    expect(ins.claimsByModel[0]).toEqual({ name: "Volt City", value: 2 });
  });

  it("builds the battery fleet report with at-risk liability", async () => {
    await batteryWarranty("VIN-LOW1", 60); // at risk (< 70)
    await batteryWarranty("VIN-LOW2", 68); // at risk
    await batteryWarranty("VIN-OK", 85); // healthy

    const ins = await warrantyInsights();
    expect(ins.battery.atRisk).toBe(2);
    // buckets: one ≥90? no; 80-89 has 1; 70-79 has 0; <70 has 2
    const below70 = ins.battery.buckets.find((b) => b.name === "< 70%");
    expect(below70?.value).toBe(2);
    // no approved battery claims yet → nominal 150k each
    expect(ins.battery.estimatedLiability).toBe(300000);
    expect(ins.battery.avgSoH).toBeCloseTo((60 + 68 + 85) / 3, 1);
  });
});
