"use client";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Wrench,
  Activity,
  TrendingUp,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney } from "@/lib/format";
import type { TechnicianProductivity } from "./schema";
import { useTechnicianAnalytics } from "./queries";

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

export function TechnicianAnalytics() {
  const { data, isLoading } = useTechnicianAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "Technicians",
      value: data.total,
      icon: Users,
      sub: `${data.active} active`,
    },
    {
      label: "HV certified",
      value: data.hvCertified,
      icon: ShieldCheck,
      tone: "positive",
      sub: "cleared for high-voltage work",
    },
    {
      label: "Open jobs",
      value: data.openJobs,
      icon: Wrench,
      tone: data.openJobs > 0 ? "warning" : undefined,
      sub: `avg ${data.avgJobsPerTech} jobs/tech`,
    },
    {
      label: "Utilization",
      value: `${data.utilization}%`,
      icon: Activity,
      sub: `${data.busy} of ${data.active} on a job`,
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-3">
        <CategoryBarChart
          title="Workload by technician"
          data={data?.workload ?? []}
          emptyMessage="No jobs assigned yet."
        />
        <CategoryBarChart
          title="Certification overview"
          data={data?.certification ?? []}
          emptyMessage="No technicians yet."
        />
        <CategoryBarChart
          title="Skill overview"
          data={data?.skills ?? []}
          emptyMessage="No skills recorded yet."
        />
      </div>

      <ProductivitySummary loading={isLoading} data={data?.productivity} />
    </div>
  );
}

function ProductivitySummary({
  loading,
  data,
}: {
  loading?: boolean;
  data?: TechnicianProductivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="size-4 text-muted-foreground" />
          Productivity summary
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No technicians yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Technician</th>
                <th className="p-3 text-right font-medium">Open</th>
                <th className="p-3 text-right font-medium">Completed</th>
                <th className="p-3 text-right font-medium">Revenue</th>
                <th className="p-3 text-right font-medium">Avg turnaround</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dms/technicians/${t.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.name}
                      </Link>
                      {t.isHVCertified && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          HV
                        </Badge>
                      )}
                      {!t.active && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {t.openJobs || <span className="text-muted-foreground">0</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {t.completedJobs || (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {t.revenue > 0 ? (
                      compactMoney(t.revenue)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">
                    {fmtTurnaround(t.avgTurnaroundHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
