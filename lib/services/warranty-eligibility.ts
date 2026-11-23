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

// ─── Default OEM coverage activated at the point of sale (vehicle delivery) ───
// Each component carries independent terms, mirroring a real EV warranty pack.
export const SALE_COVERAGE: {
  component: WarrantyComponent;
  months: number;
  kmLimit: number | null;
  soHThreshold: number | null;
}[] = [
  { component: "VEHICLE", months: 36, kmLimit: 100_000, soHThreshold: null },
  { component: "POWERTRAIN", months: 60, kmLimit: 160_000, soHThreshold: null },
  { component: "BATTERY", months: 96, kmLimit: 160_000, soHThreshold: 70 },
  { component: "MOTOR", months: 60, kmLimit: 160_000, soHThreshold: null },
  { component: "CORROSION", months: 72, kmLimit: null, soHThreshold: null },
];

const COMPONENT_LABEL: Record<WarrantyComponent, string> = {
  VEHICLE: "bumper-to-bumper",
  POWERTRAIN: "powertrain",
  BATTERY: "battery",
  MOTOR: "motor",
  CONTROLLER: "controller",
  CHARGER: "on-board charger",
  CORROSION: "corrosion",
};

// Diagnostic-trouble-code prefixes each cover is expected to handle. Advisory
// only (OEM taxonomies vary), so a mismatch warns rather than hard-rejects.
const COVERED_FAULT_PREFIXES: Record<WarrantyComponent, string[]> = {
  VEHICLE: [], // bumper-to-bumper covers every system
  POWERTRAIN: ["P0C", "P0D", "MOT", "INV", "PWT"],
  BATTERY: ["P0A", "BMS", "HV", "BAT"],
  MOTOR: ["P0C", "MOT"],
  CONTROLLER: ["P0D", "ECU", "INV", "CTL"],
  CHARGER: ["OBC", "P0E", "CHG"],
  CORROSION: ["COR", "RUST"],
};

export type CheckStatus = "pass" | "fail" | "warn" | "na";
export type EligibilityCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
};
export type EligibilityReport = {
  eligible: boolean; // false if any hard check fails
  preQualified: boolean; // battery SoH dropped below threshold → auto pre-qualify
  note: string;
  checks: EligibilityCheck[];
};

export type EligibilityReportInput = EligibilityInput & {
  faultCode?: string | null;
  lastServiceAt?: Date | null;
  maintenanceScheduleMonths?: number; // OEM cadence, default 12
};

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth()) -
    (b.getDate() < a.getDate() ? 1 : 0)
  );
}

// The full EV-specific eligibility breakdown used by the automated check UI and
// stored on the claim at submit. Hard checks (active / period / mileage /
// battery SoH) drive the verdict; fault-code + maintenance are advisory.
export function evaluateEligibilityReport(
  p: EligibilityReportInput,
): EligibilityReport {
  const asOf = p.asOf ?? new Date();
  const checks: EligibilityCheck[] = [];

  // 1 — Warranty active
  checks.push(
    p.status === "VOID"
      ? { key: "active", label: "Warranty active", status: "fail", detail: "Warranty is void." }
      : { key: "active", label: "Warranty active", status: "pass", detail: "Registration is active." },
  );

  // 2 — Within coverage period
  const expiry = warrantyExpiry(p.startDate, p.months);
  const withinPeriod = asOf <= expiry;
  checks.push({
    key: "period",
    label: "Within coverage period",
    status: withinPeriod ? "pass" : "fail",
    detail: withinPeriod
      ? `Covered until ${expiry.toISOString().slice(0, 10)} (${Math.max(0, daysBetween(asOf, expiry))} days left).`
      : `Coverage ended on ${expiry.toISOString().slice(0, 10)}.`,
  });

  // 3 — Within mileage limit
  if (p.kmLimit == null) {
    checks.push({ key: "mileage", label: "Within mileage limit", status: "na", detail: "No mileage cap on this cover." });
  } else if (p.odometerKm == null) {
    checks.push({
      key: "mileage",
      label: "Within mileage limit",
      status: "warn",
      detail: `Odometer unknown — limit is ${p.kmLimit.toLocaleString()} km.`,
    });
  } else {
    const ok = p.odometerKm <= p.kmLimit;
    checks.push({
      key: "mileage",
      label: "Within mileage limit",
      status: ok ? "pass" : "fail",
      detail: `${p.odometerKm.toLocaleString()} km of ${p.kmLimit.toLocaleString()} km used.`,
    });
  }

  // 4 — Battery State-of-Health threshold (only for battery cover)
  let preQualified = false;
  if (p.component === "BATTERY" && p.soHThreshold != null) {
    if (p.vehicleSoH == null) {
      checks.push({
        key: "battery",
        label: "Battery SoH threshold",
        status: "warn",
        detail: `SoH unknown — covered only if it has dropped below ${p.soHThreshold}%.`,
      });
    } else if (p.vehicleSoH < p.soHThreshold) {
      preQualified = true;
      checks.push({
        key: "battery",
        label: "Battery SoH threshold",
        status: "pass",
        detail: `SoH ${p.vehicleSoH}% is below the ${p.soHThreshold}% threshold — auto pre-qualified.`,
      });
    } else {
      checks.push({
        key: "battery",
        label: "Battery SoH threshold",
        status: "fail",
        detail: `SoH ${p.vehicleSoH}% is at/above the ${p.soHThreshold}% threshold — not a covered degradation.`,
      });
    }
  }

  // 5 — Fault code verification (advisory)
  const fc = p.faultCode?.trim().toUpperCase() || "";
  if (!fc) {
    checks.push({
      key: "faultCode",
      label: "Fault code verification",
      status: "warn",
      detail: "No fault code recorded — attach the DTC for OEM verification.",
    });
  } else if (p.component === "VEHICLE") {
    checks.push({
      key: "faultCode",
      label: "Fault code verification",
      status: "pass",
      detail: `${fc} — bumper-to-bumper covers all systems.`,
    });
  } else {
    const matches = (COVERED_FAULT_PREFIXES[p.component] ?? []).some((pre) =>
      fc.startsWith(pre),
    );
    checks.push({
      key: "faultCode",
      label: "Fault code verification",
      status: matches ? "pass" : "warn",
      detail: matches
        ? `${fc} matches the ${COMPONENT_LABEL[p.component]} cover.`
        : `${fc} isn't a typical ${COMPONENT_LABEL[p.component]} code — OEM may query.`,
    });
  }

  // 6 — Maintenance compliance (advisory)
  const sched = p.maintenanceScheduleMonths ?? 12;
  if (p.lastServiceAt == null) {
    checks.push({
      key: "maintenance",
      label: "Maintenance compliance",
      status: "warn",
      detail: `No service history on record — OEM may require proof of the ${sched}-month schedule.`,
    });
  } else {
    const since = monthsBetween(p.lastServiceAt, asOf);
    const ok = since <= sched;
    checks.push({
      key: "maintenance",
      label: "Maintenance compliance",
      status: ok ? "pass" : "warn",
      detail: ok
        ? `Last service ${p.lastServiceAt.toISOString().slice(0, 10)} — within the ${sched}-month schedule.`
        : `Last service ${p.lastServiceAt.toISOString().slice(0, 10)} was ${since} months ago — may breach the ${sched}-month schedule.`,
    });
  }

  const eligible = !checks.some((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn").length;
  const note = !eligible
    ? (checks.find((c) => c.status === "fail")?.detail ?? "Not eligible.")
    : preQualified
      ? "Auto pre-qualified — battery SoH is below the OEM threshold."
      : warnings > 0
        ? `Within coverage — ${warnings} item${warnings === 1 ? "" : "s"} need review before submitting.`
        : "All checks passed — within coverage.";

  return { eligible, preQualified, note, checks };
}
