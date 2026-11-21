"use client";

import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  IndianRupee,
  Clock,
  ClipboardCheck,
  Plus,
  XCircle,
  Activity,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JobCardActivity, JobCardActivityKind } from "./schema";
import { useJobCardAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

function fmtTurnaround(hours: number | null) {
  if (hours == null) return "—";
  if (hours >= 48) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
}

export function JobCardAnalytics() {
  const { data, isLoading } = useJobCardAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "Open jobs",
      value: data.open,
      icon: Wrench,
      tone: "warning",
      sub: `${compactMoney(data.openValue)} work-in-progress`,
    },
    {
      label: "Completed",
      value: data.completed,
      icon: CheckCircle2,
      tone: "positive",
      sub: `${compactMoney(data.revenue)} billed`,
    },
    {
      label: "Avg turnaround",
      value: fmtTurnaround(data.avgTurnaroundHours),
      icon: Clock,
      sub: "open → completed",
    },
    {
      label: "QC pending",
      value: data.qcPending,
      icon: ClipboardCheck,
      tone: data.qcPending > 0 ? "warning" : "positive",
      sub: "open jobs without sign-off",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-3">
        <TrendChart
          title="Completions · last 6 months"
          data={data?.completionsByMonth ?? []}
        />
        <CategoryBarChart
          title="Jobs by status"
          data={data?.byStatus ?? []}
          emptyMessage="No job cards yet."
        />
        <CategoryBarChart
          title="Jobs by technician"
          data={data?.byTechnician ?? []}
          emptyMessage="No technicians assigned yet."
        />
      </div>

      <RecentActivity loading={isLoading} data={data?.recentActivity} />
    </div>
  );
}

const KIND_META: Record<
  JobCardActivityKind,
  { icon: typeof Plus; label: string; cls: string }
> = {
  OPENED: {
    icon: Plus,
    label: "Opened",
    cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  QC: {
    icon: ClipboardCheck,
    label: "Quality check",
    cls: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: "Completed",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  CANCELLED: {
    icon: XCircle,
    label: "Cancelled",
    cls: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
};

function RecentActivity({
  loading,
  data,
}: {
  loading?: boolean;
  data?: JobCardActivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4 text-muted-foreground" />
          Recent workshop activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No workshop activity yet.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((e) => {
              const meta = KIND_META[e.kind];
              const Icon = meta.icon;
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      meta.cls,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{meta.label}</span>
                  <Link
                    href={`/dms/job-cards/${e.jobId}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {e.name}
                  </Link>
                  <Link
                    href={`/dms/vehicles/${e.vehicleId}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {e.vin}
                  </Link>
                  <span className="text-muted-foreground">· {e.model}</span>
                  {e.by && (
                    <span className="text-muted-foreground">· {e.by}</span>
                  )}
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    {e.amount != null && (
                      <span className="flex items-center font-medium tabular-nums text-foreground">
                        <IndianRupee className="size-3" />
                        {compactMoney(e.amount).replace("₹", "")}
                      </span>
                    )}
                    <span>{fmtDateTime(e.at)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
