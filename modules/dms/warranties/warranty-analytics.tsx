"use client";

import Link from "next/link";
import { ShieldCheck, CalendarClock, Car, Zap } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWarrantyAnalytics } from "./queries";

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WarrantyAnalytics() {
  const { data, isLoading } = useWarrantyAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Active covers", value: data.activeCovers, icon: ShieldCheck, tone: "positive" },
    {
      label: "Expiring ≤ 90 days",
      value: data.expiringSoon,
      icon: CalendarClock,
      tone: data.expiringSoon > 0 ? "warning" : undefined,
    },
    { label: "Vehicles covered", value: data.vehiclesCovered, icon: Car },
    {
      label: "Auto-registered",
      value: data.autoRegistered,
      icon: Zap,
      sub: "activated at sale",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <div className="grid gap-3 lg:grid-cols-2">
        <CategoryBarChart
          title="Active coverage by component"
          data={data?.byComponent ?? []}
          emptyMessage="No active coverage yet."
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4 text-muted-foreground" />
              Expiring soon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data || data.expiring.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                Nothing expiring in the next 90 days.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {data.expiring.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <Link
                      href={`/dms/warranties/vehicle/${e.vehicleId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {e.vehicle}
                    </Link>
                    <span className="truncate text-xs text-muted-foreground">
                      {e.component}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {fmtDay(e.expiryDate)} · {e.daysLeft}d
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
