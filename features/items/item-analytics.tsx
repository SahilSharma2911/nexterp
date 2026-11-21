"use client";

import { Package, Boxes, Wallet, AlertTriangle } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useItemAnalytics, useItems } from "./queries";
import Link from "next/link";
import { ItemThumb } from "@/components/item-art";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <CategoryBarChart
          title="Items by group"
          data={data?.byGroup ?? []}
          emptyMessage="No items yet."
          insights
        />
        <CatalogShowcase />
      </div>
    </div>
  );
}

// A visual shelf of the catalogue — product cutouts with their price.
function CatalogShowcase() {
  const { data, isLoading } = useItems({ page: 1, limit: 8, q: "", sort: "itemName:asc" });
  const rows = data?.rows ?? [];
  return (
    <Card className="h-full gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold">Catalogue</CardTitle>
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} products</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {rows.map((it) => (
              <Link
                key={it.id}
                href={`/stock/items/${it.id}`}
                className="group rounded-xl border bg-card p-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_24px_-12px_rgb(37_99_235/0.35)]"
              >
                <span className="relative block overflow-hidden rounded-lg">
                  <ItemThumb
                    imageUrl={it.imageUrl}
                    name={it.itemName}
                    group={it.itemGroup}
                    className="aspect-[4/3] h-auto w-full rounded-lg transition-transform duration-500 group-hover:scale-105"
                  />
                  {it.itemGroup && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {it.itemGroup}
                    </span>
                  )}
                </span>
                <p className="mt-2 truncate text-[13px] font-semibold">{it.itemName}</p>
                <p className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate font-mono">{it.itemCode}</span>
                  <span className="text-[13px] font-extrabold text-primary tabular-nums">
                    {fmtMoney(it.valuationRate)}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
