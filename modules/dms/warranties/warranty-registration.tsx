"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Car,
  FileWarning,
  Gauge,
  ListChecks,
  Palette,
  ShieldCheck,
  Store,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeader, Field } from "@/components/detail/detail-shell";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { COMPONENT_LABELS, type Warranty } from "./schema";
import { useVehicleRegistration, useRegisterSaleCoverage } from "./queries";

const dash = <span className="text-muted-foreground">—</span>;

function fmtDay(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WarrantyRegistration({ vehicleId }: { vehicleId: string }) {
  const canWrite = useCanWrite("dms");
  const { data, isLoading } = useVehicleRegistration(vehicleId);
  const register = useRegisterSaleCoverage();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const { vehicle, covers, summary, recentClaims } = data;
  const hasCover = covers.length > 0;

  const stats: StatItem[] = [
    { label: "Active covers", value: summary.active, icon: ShieldCheck, tone: "positive" },
    { label: "Total covers", value: summary.total, icon: ListChecks },
    {
      label: "Nearest expiry",
      value: fmtDay(summary.nearestExpiry),
      icon: CalendarClock,
    },
    {
      label: "Open claims",
      value: summary.openClaims,
      icon: FileWarning,
      tone: summary.openClaims > 0 ? "warning" : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={ShieldCheck}
        title={vehicle.vin}
        titleMono
        subtitle={
          <>
            Warranty registration ·{" "}
            {[vehicle.model, vehicle.variant, vehicle.color]
              .filter(Boolean)
              .join(" · ")}
          </>
        }
        badge={
          <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {hasCover ? "Registered at sale" : "No coverage yet"}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dms/vehicles/${vehicle.id}`}>
                <Car className="size-4" />
                Open vehicle
              </Link>
            </Button>
            {canWrite && !hasCover && (
              <Button
                size="sm"
                disabled={register.isPending}
                onClick={() => register.mutate(vehicle.id)}
              >
                <ShieldCheck className="size-4" />
                {register.isPending ? "Registering…" : "Register coverage"}
              </Button>
            )}
          </>
        }
      />

      {!hasCover && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          No warranty pack is registered for this vehicle. Coverage activates
          automatically when a vehicle is delivered — use{" "}
          <span className="font-medium">Register coverage</span> for a vehicle
          delivered earlier.
        </div>
      )}

      <StatCards items={stats} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Customer & vehicle */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserRound className="size-4 text-muted-foreground" />
              Customer &amp; vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field icon={UserRound} label="Customer" value={vehicle.customerName ?? dash} />
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
            <Field icon={Palette} label="Model" value={[vehicle.model, vehicle.variant].filter(Boolean).join(" · ")} />
            <Field icon={Store} label="Dealer" value={vehicle.dealer ?? dash} />
            <Field
              icon={Gauge}
              label="Battery SoH"
              value={vehicle.batterySoH != null ? `${vehicle.batterySoH}%` : dash}
            />
            <Field
              icon={CalendarClock}
              label="Delivered"
              value={vehicle.deliveredAt ? fmtDateTime(vehicle.deliveredAt) : dash}
            />
          </CardContent>
        </Card>

        {/* Coverage cards */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Coverage &amp; timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {covers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No coverage registered.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {covers.map((c) => (
                    <CoverCard key={c.id} cover={c} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileWarning className="size-4 text-muted-foreground" />
                Recent claims
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentClaims.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">
                  No claims against this vehicle&apos;s coverage.
                </p>
              ) : (
                <ul className="divide-y text-sm">
                  {recentClaims.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <Link
                        href={`/dms/warranty-claims/${c.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {c.component} · {c.status} · {fmtMoney(c.claimAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CoverCard({ cover }: { cover: Warranty }) {
  const [now] = useState(() => Date.now());
  const start = new Date(cover.startDate).getTime();
  const end = new Date(cover.expiryDate).getTime();
  const frac =
    end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1;
  const voided = cover.status === "VOID";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {COMPONENT_LABELS[cover.component]}
          </p>
          <p className="text-xs text-muted-foreground">
            {cover.months} months
            {cover.kmLimit != null
              ? ` · ${cover.kmLimit.toLocaleString("en-IN")} km`
              : ""}
            {cover.component === "BATTERY" && cover.soHThreshold != null
              ? ` · SoH < ${cover.soHThreshold}%`
              : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-2 py-0.5 text-[11px] font-medium",
            voided
              ? "bg-muted text-muted-foreground"
              : cover.active
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/15 text-red-600 dark:text-red-400",
          )}
        >
          {voided ? "Void" : cover.active ? "Active" : "Expired"}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            cover.active ? "bg-primary" : "bg-muted-foreground/40",
          )}
          style={{ width: `${Math.round(frac * 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{fmtDay(cover.startDate)}</span>
        <span className="flex items-center gap-1">
          {cover.autoRegistered && <Zap className="size-3" />}
          {cover.active ? `${cover.daysLeft} days left` : ""}
        </span>
        <span>{fmtDay(cover.expiryDate)}</span>
      </div>
    </div>
  );
}
