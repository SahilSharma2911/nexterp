"use client";

import { Car, PackageCheck, Truck, Warehouse, BatteryCharging } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
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
        <div className="lg:col-span-2">
          <CategoryBarChart
            title="Units by lifecycle stage"
            data={data?.byStage ?? []}
            emptyMessage="No vehicles yet."
          />
        </div>
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
    </div>
  );
}
