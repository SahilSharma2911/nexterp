"use client";

import {
  AlertTriangle,
  BatteryCharging,
  FileWarning,
  Percent,
  TrendingUp,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney } from "@/lib/format";
import { useWarrantyInsights } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function WarrantyInsights() {
  const { data, isLoading } = useWarrantyInsights();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const stats: StatItem[] = [
    { label: "Total claims", value: data.totalClaims, icon: FileWarning },
    {
      label: "Rejection rate",
      value: `${data.rejectionRate}%`,
      icon: Percent,
      tone: data.rejectionRate > 20 ? "warning" : undefined,
      sub: `${data.approvalRate}% approved`,
    },
    { label: "Avg claim value", value: compactMoney(data.avgClaimValue), icon: TrendingUp },
    {
      label: "Forecast / month",
      value: compactMoney(data.costForecast),
      icon: TrendingUp,
      sub: "warranty cost",
    },
  ];

  return (
    <div className="space-y-4">
      <StatCards items={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBarChart
          title="Claim frequency by model"
          data={data.claimsByModel}
          emptyMessage="No claims yet."
        />
        <CategoryBarChart
          title="Claim frequency by dealer"
          data={data.claimsByDealer}
          emptyMessage="No claims yet."
        />
        <CategoryBarChart
          title="Top fault codes"
          data={data.topFaultCodes}
          emptyMessage="No fault codes recorded."
        />
        <CategoryBarChart
          title="Warranty cost by month (claimed)"
          data={data.costMonthly}
          emptyMessage="No claims yet."
        />
      </div>

      {/* Battery health fleet report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BatteryCharging className="size-4 text-muted-foreground" />
            Battery health fleet report
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CategoryBarChart
              title="Fleet SoH distribution"
              data={data.battery.buckets}
              emptyMessage="No battery SoH readings."
            />
          </div>
          <div className="space-y-3">
            <Metric label="Average fleet SoH" value={`${data.battery.avgSoH}%`} />
            <Metric
              label="Batteries at risk"
              value={String(data.battery.atRisk)}
              hint="under warranty · SoH below threshold"
              tone={data.battery.atRisk > 0 ? "warning" : undefined}
            />
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-amber-700 uppercase dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                Predicted warranty liability
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {compactMoney(data.battery.estimatedLiability)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                at-risk batteries × avg battery claim
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warning";
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          "mt-0.5 text-lg font-semibold tabular-nums" +
          (tone === "warning" ? " text-amber-600 dark:text-amber-400" : "")
        }
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
