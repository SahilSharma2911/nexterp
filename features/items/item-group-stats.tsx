"use client";

import { Boxes, PackageCheck, AlertTriangle, IndianRupee } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { fmtMoney } from "@/lib/format";
import { useItemGroupStats } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function ItemGroupStats({ group }: { group: string }) {
  const { data, isLoading } = useItemGroupStats(group);

  const items: StatItem[] | undefined = data && [
    { label: "Items", value: data.total, icon: Boxes },
    { label: "In stock", value: data.inStock, icon: PackageCheck, tone: "positive" },
    {
      label: "Low stock",
      value: data.lowStock,
      icon: AlertTriangle,
      tone: data.lowStock > 0 ? "warning" : undefined,
    },
    { label: "Stock value", value: compactMoney(data.stockValue), icon: IndianRupee },
  ];

  return <StatCards items={items} loading={isLoading} />;
}
