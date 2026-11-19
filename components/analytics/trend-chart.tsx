"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type TrendPoint = { name: string; value: number };

const config = {
  value: { label: "Count", color: "var(--primary)" },
} satisfies ChartConfig;

// A compact area trend (e.g. deliveries per month) for module analytics.
export function TrendChart({
  title,
  data,
  height = 200,
  valueFormatter,
}: {
  title: string;
  data: TrendPoint[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} style={{ height }} className="w-full">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              fontSize={12}
              allowDecimals={false}
            />
            <ChartTooltip
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
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              fill="url(#fillTrend)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
