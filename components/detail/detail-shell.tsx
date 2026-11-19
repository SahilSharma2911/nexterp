"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Compact inline metric shown on the right of a detail header.
export type HeaderStat = {
  label: string;
  value: React.ReactNode;
  className?: string;
};

// A compact, consistent detail-page header: a thumbnail (image or icon),
// the identity (badge + title + subtitle), and optional inline stats.
export function DetailHeader({
  icon: Icon,
  imageUrl,
  badge,
  title,
  titleMono,
  subtitle,
  stats,
  actions,
}: {
  icon: React.ElementType;
  imageUrl?: string | null;
  badge?: React.ReactNode;
  title: string;
  titleMono?: boolean;
  subtitle?: React.ReactNode;
  stats?: HeaderStat[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted sm:size-16 sm:w-20">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <Icon className="size-7 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {badge}
            <h1
              className={cn(
                "mt-1.5 truncate text-xl font-semibold tracking-tight",
                titleMono && "font-mono",
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="flex gap-6 sm:border-l sm:pl-6">
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {s.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-base font-semibold tabular-nums",
                      s.className,
                    )}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact icon-led label/value used inside detail cards.
export function Field({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
