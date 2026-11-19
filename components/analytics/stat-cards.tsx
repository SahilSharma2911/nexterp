"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type Tone = "default" | "positive" | "negative" | "warning";

const toneClass = (tone?: Tone) =>
  tone === "negative"
    ? "text-red-600 dark:text-red-400"
    : tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";

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
    <CardContent className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {item.label}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-2xl font-semibold tabular-nums",
            toneClass(item.tone),
          )}
        >
          {item.value}
        </p>
        {item.sub && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.sub}
          </p>
        )}
      </div>
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      )}
    </CardContent>
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
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
          className,
        )}
      >
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
          <Link key={i} href={item.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <StatBody item={item} />
            </Card>
          </Link>
        ) : (
          <Card key={i} className="h-full">
            <StatBody item={item} />
          </Card>
        ),
      )}
    </div>
  );
}
