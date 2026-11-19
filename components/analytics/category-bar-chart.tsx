"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type Category = { name: string; value: number };

const config = {
  value: { label: "Count", color: "var(--primary)" },
} satisfies ChartConfig;

// A compact horizontal bar chart of category counts (e.g. units by stage,
// jobs by status) — the shared "distribution" visual for module analytics.
export function CategoryBarChart({
  title,
  data,
  emptyMessage = "No data yet.",
  height = 200,
  valueFormatter,
}: {
  title: string;
  data: Category[];
  emptyMessage?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            {emptyMessage}
          </div>
        ) : (
          <ChartContainer config={config} style={{ height }} className="w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={120}
                fontSize={12}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-medium tabular-nums">
                        {valueFormatter
                          ? valueFormatter(Number(value))
                          : value}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
