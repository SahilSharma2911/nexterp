"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type Tone = "default" | "positive" | "negative" | "warning";

const valueClass = (tone?: Tone) =>
  tone === "negative"
    ? "text-red-600 dark:text-red-400"
    : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";

export type ChipColor =
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "teal"
  | "rose"
  | "amber";

// Soft pastel disc for the icon — each tile gets its own hue, fleet-dashboard style.
const CHIP: Record<ChipColor, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20",
  green:
    "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20",
  orange:
    "bg-orange-50 text-orange-500 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20",
  violet:
    "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20",
  teal: "bg-cyan-50 text-cyan-600 ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/20",
  rose: "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20",
  amber:
    "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20",
};

// Neutral tiles cycle through these so a row never looks monochrome.
const CYCLE: ChipColor[] = ["blue", "violet", "teal", "orange"];

function chipColor(item: StatItem, index: number): ChipColor {
  if (item.color) return item.color;
  if (item.tone === "negative") return "rose";
  if (item.tone === "positive") return "green";
  if (item.tone === "warning") return "orange";
  return CYCLE[index % CYCLE.length];
}

export type StatItem = {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  href?: string;
  tone?: Tone;
  color?: ChipColor;
  sub?: string;
};

function StatBody({ item, index }: { item: StatItem; index: number }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3.5 p-4">
      {Icon && (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full ring-4",
            CHIP[chipColor(item, index)],
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {item.label}
        </p>
        <p
          className={cn(
            "truncate text-[22px] leading-tight font-bold tabular-nums",
            valueClass(item.tone),
          )}
        >
          {item.value}
        </p>
        {item.sub && (
          <p
            className={cn(
              "truncate text-[11px] font-medium",
              item.tone === "positive"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {item.sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function StatCards({
  items,
  loading,
  count = 4,
  className,
}: {
  items?: StatItem[];
  loading?: boolean;
  count?: number;
  className?: string;
}) {
  if (loading || !items) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item, i) =>
        item.href ? (
          <Link key={i} href={item.href} className="group">
            <Card className="relative h-full overflow-hidden rounded-xl py-0 shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgb(37_99_235/0.18)]">
              <StatBody item={item} index={i} />
              <ArrowUpRight className="absolute top-3 right-3 size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
            </Card>
          </Link>
        ) : (
          <Card
            key={i}
            className="h-full overflow-hidden rounded-xl py-0 shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-shadow hover:shadow-md"
          >
            <StatBody item={item} index={i} />
          </Card>
        ),
      )}
    </div>
  );
}
