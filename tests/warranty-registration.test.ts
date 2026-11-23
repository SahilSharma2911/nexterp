import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateEligibilityReport,
  SALE_COVERAGE,
} from "@/lib/services/warranty-eligibility";
import {
  getVehicleRegistration,
  registerSaleCoverage,
} from "@/lib/services/warranties";
import {
  createClaim,
  getClaimEligibility,
} from "@/lib/services/warranty-claims";
import { deliverVehicle } from "@/lib/services/vehicle-lifecycle";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

const SALE_COMPONENTS = SALE_COVERAGE.map((c) => c.component).sort();

describe("warranty auto-registration at sale", () => {
  beforeEach(resetDb);

  it("activates the full OEM pack when a vehicle is delivered", async () => {
    const v = await makeVehicle("VIN-DEL", {
      status: "PDI_DONE",
      sellingRate: 0, // skip GL posting
    });
    await deliverVehicle(v.id, { customerName: "Asha" });

    const covers = await prisma.warranty.findMany({ where: { vehicleId: v.id } });
    expect(covers.map((c) => c.component).sort()).toEqual(SALE_COMPONENTS);
    expect(covers.every((c) => c.autoRegistered)).toBe(true);
    // battery cover carries the SoH threshold
    const battery = covers.find((c) => c.component === "BATTERY");
    expect(battery?.soHThreshold).toBe(70);
  });

  it("doesn't double-register coverage", async () => {
    const v = await makeVehicle("VIN-DEL2", { status: "PDI_DONE", sellingRate: 0 });
    await deliverVehicle(v.id, { customerName: "Ben" });
    await expect(registerSaleCoverage(v.id)).rejects.toThrow(/already/i);
    const count = await prisma.warranty.count({ where: { vehicleId: v.id } });
    expect(count).toBe(SALE_COVERAGE.length);
  });

  it("manually registers coverage for an older vehicle", async () => {
    const v = await makeVehicle("VIN-OLD", { status: "AT_DEALER" });
    const { created } = await registerSaleCoverage(v.id);
    expect(created).toBe(SALE_COVERAGE.length);
    const reg = await getVehicleRegistration(v.id);
    expect(reg?.summary.total).toBe(SALE_COVERAGE.length);
    expect(reg?.summary.active).toBe(SALE_COVERAGE.length);
    expect(reg?.covers.every((c) => c.active)).toBe(true);
  });

  it("registration overview carries customer + nearest expiry", async () => {
    const v = await makeVehicle("VIN-REG", { status: "PDI_DONE", sellingRate: 0 });
    await deliverVehicle(v.id, { customerName: "Chitra" });
    const reg = await getVehicleRegistration(v.id);
    expect(reg?.vehicle.customerName).toBe("Chitra");
    expect(reg?.summary.nearestExpiry).toBeTruthy();
    // bumper-to-bumper (36mo) expires before corrosion (72mo)
    const b2b = reg?.covers.find((c) => c.component === "VEHICLE");
    expect(reg?.summary.nearestExpiry).toBe(b2b?.expiryDate);
  });
});

describe("automated eligibility report", () => {
  const base = {
    component: "BATTERY" as const,
    startDate: new Date("2026-01-01"),
    months: 96,
    kmLimit: 160000,
    soHThreshold: 70,
    status: "ACTIVE" as const,
    vehicleSoH: 65,
    odometerKm: 40000,
    asOf: new Date("2026-06-01"),
  };

  it("auto pre-qualifies when battery SoH is below threshold", () => {
    const r = evaluateEligibilityReport({ ...base, faultCode: "P0A80" });
    expect(r.eligible).toBe(true);
    expect(r.preQualified).toBe(true);
    expect(r.checks.find((c) => c.key === "battery")?.status).toBe("pass");
  });

  it("hard-fails when SoH is above threshold", () => {
    const r = evaluateEligibilityReport({ ...base, vehicleSoH: 85 });
    expect(r.eligible).toBe(false);
    expect(r.preQualified).toBe(false);
    expect(r.checks.find((c) => c.key === "battery")?.status).toBe("fail");
  });

  it("hard-fails when mileage is over the cap", () => {
    const r = evaluateEligibilityReport({ ...base, odometerKm: 200000 });
    expect(r.eligible).toBe(false);
    expect(r.checks.find((c) => c.key === "mileage")?.status).toBe("fail");
  });

  it("passes a matching fault code and warns on a mismatch", () => {
    const match = evaluateEligibilityReport({ ...base, faultCode: "BMS-12" });
    expect(match.checks.find((c) => c.key === "faultCode")?.status).toBe("pass");
    const miss = evaluateEligibilityReport({ ...base, faultCode: "ZZZ-99" });
    expect(miss.checks.find((c) => c.key === "faultCode")?.status).toBe("warn");
    // advisory — doesn't block eligibility on its own
    expect(miss.eligible).toBe(true);
  });

  it("warns when maintenance is overdue but still eligible", () => {
    const stale = evaluateEligibilityReport({
      ...base,
      faultCode: "BMS-1",
      lastServiceAt: new Date("2024-01-01"), // > 12 months before asOf
    });
    expect(stale.checks.find((c) => c.key === "maintenance")?.status).toBe("warn");
    expect(stale.eligible).toBe(true);
  });

  it("bumper-to-bumper covers any fault code", () => {
    const r = evaluateEligibilityReport({
      ...base,
      component: "VEHICLE",
      soHThreshold: null,
      faultCode: "ANYTHING-1",
    });
    expect(r.checks.find((c) => c.key === "faultCode")?.status).toBe("pass");
  });
});

describe("claim eligibility integration", () => {
  beforeEach(resetDb);

  it("pulls odometer + last service from the job card history", async () => {
    const v = await makeVehicle("VIN-ELG", { batterySoH: 60 });
    const w = await prisma.warranty.create({
      data: {
        vehicleId: v.id,
        component: "BATTERY",
        startDate: new Date("2026-01-01"),
        months: 96,
        kmLimit: 160000,
        soHThreshold: 70,
        status: "ACTIVE",
      },
    });
    const job = await prisma.jobCard.create({
      data: {
        name: "JOB-ELG-1",
        vehicleId: v.id,
        odometer: 30000,
        serviceDate: new Date("2026-05-01"),
      },
    });
    const { id } = await createClaim({
      warrantyId: w.id,
      jobCardId: job.id,
      claimDate: "2026-06-01",
      faultCode: "BMS-7",
      description: "range loss",
      claimAmount: 40000,
      remarks: "",
    });

    const e = await getClaimEligibility(id);
    expect(e).toBeTruthy();
    expect(e?.eligible).toBe(true);
    expect(e?.preQualified).toBe(true);
    expect(e?.vehicle.odometerKm).toBe(30000);
    expect(e?.job?.name).toBe("JOB-ELG-1");
    expect(e?.checks.find((c) => c.key === "maintenance")?.status).toBe("pass");
    expect(e?.checks.find((c) => c.key === "faultCode")?.status).toBe("pass");
  });
});
