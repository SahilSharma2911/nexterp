"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  Gauge,
  MinusCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/detail/detail-shell";
import { cn } from "@/lib/utils";
import { useClaimEligibility } from "./queries";
import type { CheckStatus, EligibilityCheck } from "./schema";

const dash = <span className="text-muted-foreground">—</span>;

const STATUS_UI: Record<
  CheckStatus,
  { icon: React.ElementType; cls: string; label: string }
> = {
  pass: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400", label: "Pass" },
  fail: { icon: XCircle, cls: "text-red-600 dark:text-red-400", label: "Fail" },
  warn: { icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400", label: "Review" },
  na: { icon: MinusCircle, cls: "text-muted-foreground", label: "N/A" },
};

function fmtDay(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CheckRow({ check }: { check: EligibilityCheck }) {
  const ui = STATUS_UI[check.status];
  const Icon = ui.icon;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", ui.cls)} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{check.label}</p>
        <p className="text-xs text-muted-foreground">{check.detail}</p>
      </div>
      <span className={cn("ml-auto text-[11px] font-medium", ui.cls)}>
        {ui.label}
      </span>
    </li>
  );
}

export function EligibilityPanel({ claimId }: { claimId: string }) {
  const { data, isLoading } = useClaimEligibility(claimId);

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const { eligible, preQualified, note, checks, coverage, vehicle, job } = data;

  return (
    <div className="space-y-4">
      {/* Result banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border p-4",
          eligible
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10",
        )}
      >
        {eligible ? (
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              eligible
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300",
            )}
          >
            {eligible ? "Eligible" : "Not eligible"}
            <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              EV-specific automated check
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{note}</p>
          {preQualified && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Sparkles className="size-3.5" />
              Battery SoH below OEM threshold — auto pre-qualified
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Checks summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Eligibility summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {checks.map((c) => (
                <CheckRow key={c.key} check={c} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {/* Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Warranty coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field icon={ShieldCheck} label="Component" value={coverage.component} />
              <Field icon={BadgeCheck} label="Status" value={coverage.status} />
              <Field icon={ScanLine} label="Start" value={fmtDay(coverage.startDate)} />
              <Field icon={ScanLine} label="Expires" value={fmtDay(coverage.expiryDate)} />
              <Field
                icon={Gauge}
                label="Mileage cap"
                value={
                  coverage.kmLimit != null
                    ? `${coverage.kmLimit.toLocaleString("en-IN")} km`
                    : dash
                }
              />
              <Field
                icon={Gauge}
                label="SoH threshold"
                value={coverage.soHThreshold != null ? `${coverage.soHThreshold}%` : dash}
              />
            </CardContent>
          </Card>

          {/* Vehicle & job */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Car className="size-4 text-muted-foreground" />
                Vehicle &amp; job information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                icon={Car}
                label="Vehicle"
                value={
                  <Link
                    href={`/dms/vehicles/${vehicle.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {vehicle.vin}
                  </Link>
                }
              />
              <Field icon={Car} label="Model" value={vehicle.model} />
              <Field icon={Gauge} label="Battery SoH" value={vehicle.batterySoH != null ? `${vehicle.batterySoH}%` : dash} />
              <Field icon={Gauge} label="Odometer" value={vehicle.odometerKm != null ? `${vehicle.odometerKm.toLocaleString("en-IN")} km` : dash} />
              <Field icon={ScanLine} label="Fault code" value={data.faultCode ?? dash} />
              <Field icon={Wrench} label="Last service" value={fmtDay(data.lastServiceAt)} />
              {job && (
                <Field
                  icon={Wrench}
                  label="Job card"
                  value={
                    <Link
                      href={`/dms/job-cards/${job.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {job.name}
                    </Link>
                  }
                  className="sm:col-span-2"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
