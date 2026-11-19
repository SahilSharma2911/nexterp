"use client";

import { FileWarning, BadgeCheck, CircleDollarSign, Landmark } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useClaimAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function ClaimAnalytics() {
  const { data, isLoading } = useClaimAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "In pipeline",
      value: data.open,
      icon: FileWarning,
      tone: "warning",
      sub: "draft + submitted",
    },
    { label: "Approved", value: data.approved, icon: BadgeCheck, tone: "positive" },
    {
      label: "Claimed value",
      value: compactMoney(data.claimedValue),
      icon: CircleDollarSign,
      sub: "active claims",
    },
    {
      label: "Approved by OEM",
      value: compactMoney(data.approvedValue),
      icon: Landmark,
      tone: "positive",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Claims by status"
        data={data?.byStatus ?? []}
        emptyMessage="No warranty claims yet."
      />
    </div>
  );
}
