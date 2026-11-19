"use client";

import { Warehouse, Wallet, Boxes } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useWarehouseAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function WarehouseAnalytics() {
  const { data, isLoading } = useWarehouseAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Warehouses", value: data.total, icon: Warehouse },
    {
      label: "Items stocked",
      value: data.itemsStocked,
      icon: Boxes,
      sub: "with on-hand quantity",
    },
    {
      label: "Total stock value",
      value: compactMoney(data.stockValue),
      icon: Wallet,
      sub: "across all warehouses",
    },
    {
      label: "Avg per warehouse",
      value: data.total ? compactMoney(data.stockValue / data.total) : "—",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Stock value by warehouse"
        data={data?.byWarehouse ?? []}
        emptyMessage="No stock yet."
        valueFormatter={compactMoney}
      />
    </div>
  );
}
