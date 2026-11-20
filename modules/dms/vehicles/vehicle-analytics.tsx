"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Car,
  PackageCheck,
  Truck,
  Warehouse,
  BatteryCharging,
  Activity,
  Hourglass,
  ArrowRight,
  Workflow,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./columns";
import type { VehicleActivity, FifoVehicle } from "./schema";
import { useVehicleAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function VehicleAnalytics() {
  const { data, isLoading } = useVehicleAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Total units", value: data.total, icon: Car },
    {
      label: "At warehouse",
      value: data.inStock,
      icon: Warehouse,
      sub: `${data.inPipeline} in transit to dealers`,
    },
    {
      label: "Delivered",
      value: data.delivered,
      icon: PackageCheck,
      tone: "positive",
      sub: `${compactMoney(data.deliveredValue)} sold`,
    },
    {
      label: "Inventory value",
      value: compactMoney(data.inventoryValue),
      icon: Truck,
      sub: "cost of unsold stock",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-3">
        <TrendChart
          title="Deliveries · last 6 months"
          data={data?.deliveriesByMonth ?? []}
        />
        <CategoryBarChart
          title="Units by lifecycle stage"
          data={data?.byStage ?? []}
          emptyMessage="No vehicles yet."
        />
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">Fleet battery health</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[200px] flex-col items-center justify-center gap-1">
            <BatteryCharging className="size-7 text-primary" />
            <p className="text-4xl font-semibold tabular-nums">
              {data?.avgSoH != null ? `${data.avgSoH.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              average battery State of Health
            </p>
          </CardContent>
        </Card>
      </div>

      <FifoAging
        loading={isLoading}
        queue={data?.fifoQueue}
        oldestDays={data?.oldestDays ?? 0}
        avgAgeDays={data?.avgAgeDays ?? 0}
        agingCount={data?.agingCount ?? 0}
        threshold={data?.agingThreshold ?? 60}
      />

      <RecentActivity loading={isLoading} data={data?.recentActivity} />
    </div>
  );
}

function FifoAging({
  loading,
  queue,
  oldestDays,
  avgAgeDays,
  agingCount,
  threshold,
}: {
  loading?: boolean;
  queue?: FifoVehicle[];
  oldestDays: number;
  avgAgeDays: number;
  agingCount: number;
  threshold: number;
}) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Hourglass className="size-4 text-muted-foreground" />
            Stock aging · FIFO
          </CardTitle>
          <div className="flex gap-6">
            <MiniStat label="Oldest" value={`${oldestDays}d`} />
            <MiniStat label="Avg age" value={`${avgAgeDays}d`} />
            <MiniStat
              label={`Aging >${threshold}d`}
              value={agingCount}
              tone={agingCount > 0 ? "warning" : undefined}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Allocate the oldest matching unit first — the top one is next in
            line.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/dms/allocation">
              <Workflow className="size-4" />
              FIFO allocation
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !queue || queue.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No units in stock.
          </p>
        ) : (
          <ul className="divide-y">
            {queue.map((v, i) => {
              const aging = v.daysInStock > threshold;
              return (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <Link
                    href={`/dms/vehicles/${v.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {v.vin}
                  </Link>
                  <span className="text-muted-foreground">
                    {[v.model, v.variant].filter(Boolean).join(" · ")}
                  </span>
                  {v.warehouse && (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {v.warehouse}
                    </span>
                  )}
                  {i === 0 && (
                    <Badge className="gap-1">
                      <ArrowRight className="size-3" />
                      Next to allocate
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "ml-auto text-xs tabular-nums",
                      aging
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {v.daysInStock}d in stock
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

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RecentActivity({
  loading,
  data,
}: {
  loading?: boolean;
  data?: VehicleActivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4 text-muted-foreground" />
          Recent vehicle activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No lifecycle activity yet.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {e.imageUrl ? (
                    <Image
                      src={e.imageUrl}
                      alt={e.model}
                      fill
                      sizes="36px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Car className="size-4 text-muted-foreground" />
                  )}
                </span>
                <StatusBadge status={e.stage} />
                <Link
                  href={`/dms/vehicles/${e.vehicleId}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {e.vin}
                </Link>
                <span className="text-muted-foreground">{e.model}</span>
                {e.note && (
                  <span className="truncate text-muted-foreground">
                    · {e.note}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  {e.byUser && <span>{e.byUser}</span>}
                  <span>{fmtDateTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
