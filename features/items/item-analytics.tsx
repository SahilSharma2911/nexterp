"use client";

import { Package, Boxes, Wallet, AlertTriangle } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useItemAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function ItemAnalytics() {
  const { data, isLoading } = useItemAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Total items", value: data.total, icon: Package },
    {
      label: "Stock items",
      value: data.stockItems,
      icon: Boxes,
      sub: "tracked in inventory",
    },
    {
      label: "Stock value",
      value: compactMoney(data.stockValue),
      icon: Wallet,
      sub: "on-hand valuation",
    },
    {
      label: "Low stock",
      value: data.lowStock,
      icon: AlertTriangle,
      tone: data.lowStock > 0 ? "negative" : "positive",
      sub: "below reorder level",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Items by group"
        data={data?.byGroup ?? []}
        emptyMessage="No items yet."
      />
    </div>
  );
}
