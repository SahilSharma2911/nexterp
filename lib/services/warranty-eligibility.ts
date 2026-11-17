import type { WarrantyComponent, WarrantyStatus } from "@prisma/client";

// Shared warranty maths — used by both registrations (coverage/active display)
// and claims (eligibility verdict at submit). Pure, no DB.

export function warrantyExpiry(startDate: Date, months: number): Date {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export type EligibilityInput = {
  component: WarrantyComponent;
  startDate: Date;
  months: number;
  kmLimit: number | null;
  soHThreshold: number | null;
  status: WarrantyStatus;
  vehicleSoH: number | null;
  odometerKm?: number | null;
  asOf?: Date;
};

export type EligibilityResult = { eligible: boolean; note: string };

export function evaluateEligibility(p: EligibilityInput): EligibilityResult {
  const asOf = p.asOf ?? new Date();

  if (p.status === "VOID") return { eligible: false, note: "Warranty is void." };

  const expiry = warrantyExpiry(p.startDate, p.months);
  if (asOf > expiry) {
    return {
      eligible: false,
      note: `Coverage ended on ${expiry.toISOString().slice(0, 10)}.`,
    };
  }

  if (p.kmLimit != null && p.odometerKm != null && p.odometerKm > p.kmLimit) {
    return {
      eligible: false,
      note: `Usage ${p.odometerKm} km exceeds the ${p.kmLimit} km limit.`,
    };
  }

  // Battery degradation warranties only cover a drop BELOW the SoH threshold.
  if (p.component === "BATTERY" && p.soHThreshold != null) {
    if (p.vehicleSoH == null) {
      return {
        eligible: true,
        note: "Within period; battery SoH unknown — verify before submitting.",
      };
    }
    if (p.vehicleSoH >= p.soHThreshold) {
      return {
        eligible: false,
        note: `Battery SoH ${p.vehicleSoH}% is at/above the ${p.soHThreshold}% threshold — not a covered degradation.`,
      };
    }
    return {
      eligible: true,
      note: `Within period; battery SoH ${p.vehicleSoH}% below the ${p.soHThreshold}% threshold.`,
    };
  }

  return { eligible: true, note: "Within coverage period." };
}
