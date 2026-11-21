"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type TrendPoint = { name: string; value: number };

const config = {
  value: { label: "Count", color: "var(--primary)" },
} satisfies ChartConfig;

// A compact area trend (e.g. deliveries per month) with a headline total and
// the latest period's change.
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
  const fill = `trend-${useId().replace(/:/g, "")}`;
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : v.toLocaleString("en-IN"));
  const total = data.reduce((s, d) => s + d.value, 0);
  const last = data.at(-1)?.value ?? 0;
  const prev = data.at(-2)?.value ?? 0;
  const delta = last - prev;
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;

  return (
    <Card className="h-full gap-3">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm font-bold">{title}</CardTitle>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{fmt(total)}</p>
        </div>
        {data.length > 1 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
              delta > 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                : delta < 0
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                  : "bg-muted text-muted-foreground",
            )}
            title="Change vs the previous period"
          >
            <DeltaIcon className="size-3.5" />
            {delta > 0 ? "+" : ""}
            {fmt(delta)} vs last
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ChartContainer
          config={config}
          style={{ minHeight: height - 36 }}
          className="aspect-auto w-full flex-1"
        >
          <AreaChart data={data} margin={{ left: -8, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.6} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={32} fontSize={11} allowDecimals={false} />
            <ChartTooltip
              cursor={{ stroke: "var(--color-value)", strokeOpacity: 0.25, strokeWidth: 24 }}
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-bold tabular-nums">{fmt(Number(value))}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              fill={`url(#${fill})`}
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--card)", stroke: "var(--color-value)", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "var(--color-value)", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
