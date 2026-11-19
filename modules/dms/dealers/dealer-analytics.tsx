"use client";

import { Building2, BadgeCheck, Car } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { useDealerAnalytics } from "./queries";

export function DealerAnalytics() {
  const { data, isLoading } = useDealerAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Dealers", value: data.total, icon: Building2 },
    {
      label: "Active",
      value: data.active,
      icon: BadgeCheck,
      tone: "positive",
      sub: `${data.total - data.active} disabled`,
    },
    {
      label: "Vehicles assigned",
      value: data.vehiclesAssigned,
      icon: Car,
      sub: "across the network",
    },
    {
      label: "Avg per dealer",
      value: data.total ? (data.vehiclesAssigned / data.total).toFixed(1) : "0",
      icon: Car,
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Top dealers by vehicles"
        data={data?.byDealer ?? []}
        emptyMessage="No dealers yet."
      />
    </div>
  );
}
