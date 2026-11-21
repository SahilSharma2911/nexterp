"use client";

import Link from "next/link";
import { VehicleThumb } from "@/components/vehicle-art";
import {
  Car,
  PackageCheck,
  Truck,
  Warehouse,
  BatteryCharging,
  Activity,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { RadialGauge } from "@/components/analytics/radial-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./columns";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_COLORS,
  type VehicleActivity,
} from "./schema";

// byStage arrives in VEHICLE_STATUSES order.
const STAGE_COLORS = VEHICLE_STATUSES.map((s) => VEHICLE_STATUS_COLORS[s]);
import { useVehicleAnalytics } from "./queries";
import { FifoAgingCard } from "./fifo-aging-card";

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
          colors={STAGE_COLORS}
          emptyMessage="No vehicles yet."
        />
        <Card className="h-full gap-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <BatteryCharging className="size-4 text-emerald-500" />
              Fleet battery health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[200px] flex-1 items-center justify-center">
            <RadialGauge
              value={data?.avgSoH ?? null}
              caption="average battery State of Health"
            />
          </CardContent>
        </Card>
      </div>

      <FifoAgingCard />

      <RecentActivity loading={isLoading} data={data?.recentActivity} />
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
                <VehicleThumb imageUrl={e.imageUrl} model={e.model} className="size-9" />
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
