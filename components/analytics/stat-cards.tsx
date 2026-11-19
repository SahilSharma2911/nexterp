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
    : tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";

// Soft gradient + ring for the icon chip, tinted by tone.
const chipClass = (tone?: Tone) =>
  tone === "negative"
    ? "from-red-500/20 to-red-500/5 text-red-600 ring-red-500/20 dark:text-red-400"
    : tone === "positive"
      ? "from-emerald-500/20 to-emerald-500/5 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
      : tone === "warning"
        ? "from-amber-500/20 to-amber-500/5 text-amber-600 ring-amber-500/20 dark:text-amber-400"
        : "from-primary/20 to-primary/5 text-primary ring-primary/20";

export type StatItem = {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  href?: string;
  tone?: Tone;
  sub?: string;
};

function StatBody({ item }: { item: StatItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {item.label}
        </p>
        <p
          className={cn(
            "truncate text-[26px] leading-tight font-semibold tabular-nums",
            valueClass(item.tone),
          )}
        >
          {item.value}
        </p>
        {item.sub && (
          <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
        )}
      </div>
      {Icon && (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset",
            chipClass(item.tone),
          )}
        >
          <Icon className="size-[22px]" />
        </span>
      )}
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
          <Skeleton key={i} className="h-[104px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item, i) =>
        item.href ? (
          <Link key={i} href={item.href} className="group">
            <Card className="relative h-full overflow-hidden py-0 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <StatBody item={item} />
              <ArrowUpRight className="absolute top-3 right-3 size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
            </Card>
          </Link>
        ) : (
          <Card
            key={i}
            className="h-full overflow-hidden py-0 shadow-xs transition-shadow hover:shadow-md"
          >
            <StatBody item={item} />
          </Card>
        ),
      )}
    </div>
  );
}
