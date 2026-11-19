"use client";

import { Wrench, CheckCircle2, IndianRupee, Package } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useJobCardAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function JobCardAnalytics() {
  const { data, isLoading } = useJobCardAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Open jobs", value: data.open, icon: Wrench, tone: "warning" },
    {
      label: "Completed",
      value: data.completed,
      icon: CheckCircle2,
      tone: "positive",
    },
    {
      label: "Service revenue",
      value: compactMoney(data.revenue),
      icon: IndianRupee,
      sub: "billed on completed jobs",
    },
    {
      label: "Parts vs labour",
      value: `${compactMoney(data.partsValue)} / ${compactMoney(data.laborValue)}`,
      icon: Package,
      sub: "parts / labour billed",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Jobs by status"
        data={data?.byStatus ?? []}
        emptyMessage="No job cards yet."
        height={160}
      />
    </div>
  );
}
