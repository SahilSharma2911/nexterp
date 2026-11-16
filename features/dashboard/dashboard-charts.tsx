"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { fmtMoney } from "@/lib/format";
import type { MonthlyPoint, WarehouseValue } from "./schema";

// Compact money for axis ticks (₹12k, ₹1.2L).
function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1e3) return `₹${Math.round(v / 1e3)}k`;
  return `₹${v}`;
}

const trendConfig = {
  sales: { label: "Sales", color: "var(--primary)" },
  purchases: { label: "Purchases", color: "var(--chart-3)" },
} satisfies ChartConfig;

const warehouseConfig = {
  value: { label: "Stock Value", color: "var(--primary)" },
} satisfies ChartConfig;

export function DashboardCharts({
  trend,
  stockByWarehouse,
}: {
  trend: MonthlyPoint[];
  stockByWarehouse: WarehouseValue[];
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Sales vs Purchases · last 6 months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-[260px] w-full">
            <AreaChart data={trend} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
                <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-purchases)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-purchases)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                fontSize={12}
                tickFormatter={(v) => compactMoney(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground capitalize">
                          {name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {fmtMoney(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="sales"
                type="monotone"
                stroke="var(--color-sales)"
                fill="url(#fillSales)"
                strokeWidth={2}
              />
              <Area
                dataKey="purchases"
                type="monotone"
                stroke="var(--color-purchases)"
                fill="url(#fillPurchases)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stock value by warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          {stockByWarehouse.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No stock yet.
            </div>
          ) : (
            <ChartContainer
              config={warehouseConfig}
              className="h-[260px] w-full"
            >
              <BarChart
                data={stockByWarehouse}
                margin={{ left: 4, right: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="warehouse"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  fontSize={12}
                  tickFormatter={(v) => compactMoney(Number(v))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-medium tabular-nums">
                          {fmtMoney(Number(value))}
                        </span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
