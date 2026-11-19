"use client";

import { BadgeIndianRupee, BadgeCheck, Banknote, HandCoins } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useSubsidyClaimAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function SubsidyClaimAnalytics() {
  const { data, isLoading } = useSubsidyClaimAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "In pipeline",
      value: data.open,
      icon: BadgeIndianRupee,
      tone: "warning",
      sub: "draft + submitted",
    },
    { label: "Approved", value: data.approved, icon: BadgeCheck, tone: "positive" },
    {
      label: "Claimed value",
      value: compactMoney(data.claimedValue),
      icon: Banknote,
      sub: "active claims",
    },
    {
      label: "Disbursed",
      value: compactMoney(data.disbursedValue),
      icon: HandCoins,
      tone: "positive",
      sub: `${data.disbursed} paid out`,
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Subsidy claims by status"
        data={data?.byStatus ?? []}
        emptyMessage="No subsidy claims yet."
      />
    </div>
  );
}
