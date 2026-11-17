import { describe, it, expect } from "vitest";
import {
  evaluateEligibility,
  warrantyExpiry,
} from "@/lib/services/warranty-eligibility";

const base = {
  startDate: new Date("2026-01-01"),
  months: 36,
  kmLimit: null as number | null,
  soHThreshold: null as number | null,
  status: "ACTIVE" as const,
  vehicleSoH: null as number | null,
  asOf: new Date("2026-06-01"),
};

describe("warrantyExpiry", () => {
  it("adds months to the start date", () => {
    expect(warrantyExpiry(new Date("2026-01-15"), 12).toISOString().slice(0, 10)).toBe(
      "2027-01-15",
    );
  });
});

describe("evaluateEligibility", () => {
  it("rejects a void warranty", () => {
    const r = evaluateEligibility({ ...base, component: "VEHICLE", status: "VOID" });
    expect(r.eligible).toBe(false);
    expect(r.note).toMatch(/void/i);
  });

  it("rejects when the coverage period has ended", () => {
    const r = evaluateEligibility({
      ...base,
      component: "VEHICLE",
      months: 3,
      asOf: new Date("2026-09-01"), // > start + 3mo
    });
    expect(r.eligible).toBe(false);
    expect(r.note).toMatch(/ended/i);
  });

  it("accepts a non-battery component within the period", () => {
    const r = evaluateEligibility({ ...base, component: "MOTOR" });
    expect(r.eligible).toBe(true);
  });

  it("rejects when the km limit is exceeded", () => {
    const r = evaluateEligibility({
      ...base,
      component: "VEHICLE",
      kmLimit: 30000,
      odometerKm: 45000,
    });
    expect(r.eligible).toBe(false);
    expect(r.note).toMatch(/km/i);
  });

  it("battery: eligible with a note when SoH is unknown", () => {
    const r = evaluateEligibility({
      ...base,
      component: "BATTERY",
      soHThreshold: 80,
      vehicleSoH: null,
    });
    expect(r.eligible).toBe(true);
    expect(r.note).toMatch(/unknown/i);
  });

  it("battery: NOT eligible when SoH is at/above the threshold", () => {
    const r = evaluateEligibility({
      ...base,
      component: "BATTERY",
      soHThreshold: 80,
      vehicleSoH: 85,
    });
    expect(r.eligible).toBe(false);
    expect(r.note).toMatch(/threshold/i);
  });

  it("battery: eligible when SoH has dropped below the threshold", () => {
    const r = evaluateEligibility({
      ...base,
      component: "BATTERY",
      soHThreshold: 80,
      vehicleSoH: 72,
    });
    expect(r.eligible).toBe(true);
    expect(r.note).toMatch(/below/i);
  });

  it("battery without a threshold is covered on period alone", () => {
    const r = evaluateEligibility({
      ...base,
      component: "BATTERY",
      soHThreshold: null,
      vehicleSoH: 50,
    });
    expect(r.eligible).toBe(true);
  });
});
