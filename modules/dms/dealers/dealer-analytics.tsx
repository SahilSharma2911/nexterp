"use client";

import Link from "next/link";
import {
  Building2,
  PackageCheck,
  Truck,
  ClipboardList,
  Trophy,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney } from "@/lib/format";
import type { DealerLeaderRow } from "./schema";
import { useDealerAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function DealerAnalytics() {
  const { data, isLoading } = useDealerAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "Dealers",
      value: data.total,
      icon: Building2,
      sub: `${data.active} active · ${data.total - data.active} disabled`,
    },
    {
      label: "Delivered",
      value: data.delivered,
      icon: PackageCheck,
      tone: "positive",
      sub: `${compactMoney(data.deliveredValue)} sold through network`,
    },
    {
      label: "In pipeline",
      value: data.pipeline,
      icon: Truck,
      sub: "allocated · in transit · at dealer",
    },
    {
      label: "Open demand",
      value: data.openDemand,
      icon: ClipboardList,
      tone: data.openDemand > 0 ? "warning" : undefined,
      sub: "units requested, not yet allocated",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-3">
        <TrendChart
          title="Network deliveries · last 6 months"
          data={data?.deliveriesByMonth ?? []}
        />
        <CategoryBarChart
          title="Dealers by region"
          data={data?.byRegion ?? []}
          emptyMessage="No dealers yet."
        />
        <CategoryBarChart
          title="Top dealers by value"
          data={data?.topByValue ?? []}
          emptyMessage="No deliveries yet."
          valueFormatter={compactMoney}
        />
      </div>

      <DealerLeaderboard loading={isLoading} data={data?.leaderboard} />
    </div>
  );
}

function DealerLeaderboard({
  loading,
  data,
}: {
  loading?: boolean;
  data?: DealerLeaderRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="size-4 text-muted-foreground" />
          Dealer leaderboard
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
          <p className="p-4 text-sm text-muted-foreground">No dealers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Dealer</th>
                <th className="p-3 text-right font-medium">Assigned</th>
                <th className="p-3 text-right font-medium">Pipeline</th>
                <th className="p-3 text-right font-medium">Delivered</th>
                <th className="p-3 text-right font-medium">Value sold</th>
                <th className="p-3 text-right font-medium">Open demand</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/dms/dealers/${d.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {d.name}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {d.code}
                    </span>
                    {(d.city || d.state) && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · {[d.city, d.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">{d.assigned}</td>
                  <td className="p-3 text-right tabular-nums">
                    {d.pipeline || (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {d.delivered || (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {d.deliveredValue > 0 ? (
                      compactMoney(d.deliveredValue)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {d.openDemand > 0 ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {d.openDemand}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
