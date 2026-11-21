"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Crown, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type Category = { name: string; value: number };

type SliceLabel = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
};

// Share % printed inside each slice (skipped when the slice is too thin).
function SliceLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  value = 0,
  total,
}: SliceLabel & { total: number }) {
  const share = total ? (value / total) * 100 : 0;
  if (share < 6) return null;
  const r = innerRadius + (outerRadius - innerRadius) / 2;
  const rad = (-midAngle * Math.PI) / 180;
  return (
    <text
      x={cx + r * Math.cos(rad)}
      y={cy + r * Math.sin(rad)}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10.5}
      fontWeight={700}
      style={{ pointerEvents: "none" }}
    >
      {share.toFixed(1)}%
    </text>
  );
}

// A lively, readable palette for categories, tuned to the cobalt theme.
export const CHART_PALETTE = [
  "#2563eb", // blue
  "#10b981", // emerald
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
];

// The shared "distribution" card for module analytics (units by stage, items
// by group, jobs by status…): a DMSJoy-style donut with a value (share%)
// legend, a stacked share bar and two quick insights. The layout follows the
// card's width — stacked when narrow, three columns when it spans the page —
// and the content is centred so a tall or wide card never looks empty.
export function CategoryBarChart({
  title,
  data,
  emptyMessage = "No data yet.",
  height = 200,
  valueFormatter,
  colors,
  insights = false,
}: {
  title: string;
  data: Category[];
  emptyMessage?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
  colors?: string[];
  /** Show the share bar + insight tiles even when the card is narrow (they
   *  always appear when the card spans the page). Use when a taller
   *  neighbour would otherwise leave this card half empty. */
  insights?: boolean;
}) {
  const palette = colors ?? CHART_PALETTE;
  const rows = data.map((d, i) => ({ ...d, fill: palette[i % palette.length] }));
  const slices = rows.filter((d) => d.value > 0);
  const total = rows.reduce((s, d) => s + d.value, 0);
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : v.toLocaleString("en-IN"));
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  const config = Object.fromEntries(rows.map((d) => [d.name, { label: d.name, color: d.fill }]));
  const top = slices.reduce<(typeof rows)[number] | null>(
    (best, d) => (!best || d.value > best.value ? d : best),
    null,
  );

  return (
    <Card className="@container h-full gap-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        {total > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {rows.length} categor{rows.length === 1 ? "y" : "ies"}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {total === 0 ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-center @3xl:gap-8">
            {/* Donut + legend */}
            <div className="flex flex-1 flex-col items-center gap-5 @sm:flex-row @sm:gap-5 @md:gap-7">
              <div className="relative size-[168px] shrink-0">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex size-[78px] flex-col items-center justify-center rounded-full bg-card shadow-[0_4px_14px_-4px_rgb(15_23_42/0.25)] ring-1 ring-border">
                    <span className="text-[10.5px] font-semibold text-muted-foreground">Total</span>
                    <span className="max-w-[70px] truncate text-[18px] leading-tight font-extrabold tabular-nums">
                      {fmt(total)}
                    </span>
                  </span>
                </div>
                <ChartContainer config={config} className="relative z-10 aspect-square size-[168px]">
                  <PieChart>
                    <ChartTooltip
                      wrapperStyle={{ zIndex: 30 }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey="name"
                          formatter={(value, name) => (
                            <span className="flex w-full items-center justify-between gap-3">
                              <span className="text-muted-foreground">{name}</span>
                              <span className="font-bold tabular-nums">{fmt(Number(value))}</span>
                            </span>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={slices}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={82}
                      startAngle={90}
                      endAngle={-270}
                      stroke="var(--card)"
                      strokeWidth={slices.length > 1 ? 2 : 0}
                      labelLine={false}
                      label={(p: SliceLabel) => <SliceLabel {...p} total={total} />}
                    >
                      {slices.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              <ul className="w-full min-w-0 flex-1 space-y-0.5 text-xs @md:text-[12.5px]">
                {rows.map((d) => (
                  <li
                    key={d.name}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/60",
                      d.value === 0 && "opacity-50",
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
                    <span className="min-w-0 truncate text-muted-foreground" title={d.name}>
                      {d.name}
                    </span>
                    <span className="ml-auto shrink-0 pl-1 font-bold whitespace-nowrap tabular-nums">
                      {fmt(d.value)}
                      <span className="ml-1 font-medium text-muted-foreground">
                        ({pct(d.value).toFixed(1)}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Share bar + insights */}
            <div
              className={cn(
                "flex-col gap-3 @3xl:flex @3xl:w-64 @3xl:shrink-0",
                insights ? "flex" : "hidden",
              )}
            >
              <div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {slices.map((d) => (
                    <span
                      key={d.name}
                      className="h-full"
                      style={{ width: `${pct(d.value)}%`, background: d.fill }}
                      title={`${d.name}: ${pct(d.value).toFixed(1)}%`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Share of total</p>
              </div>
              <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-1">
                {top && (
                  <div className="min-w-0 rounded-xl border bg-muted/30 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Crown className="size-3.5 text-amber-500" />
                      Largest
                    </p>
                    <p className="mt-1 truncate text-sm font-bold">{top.name}</p>
                    <p className="text-xs font-semibold tabular-nums" style={{ color: top.fill }}>
                      {fmt(top.value)} · {pct(top.value).toFixed(0)}%
                    </p>
                  </div>
                )}
                <div className="min-w-0 rounded-xl border bg-muted/30 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Layers className="size-3.5 text-primary" />
                    Active
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">
                    {slices.length} of {rows.length}
                  </p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    avg {fmt(Math.round((total / Math.max(1, slices.length)) * 10) / 10)} each
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
