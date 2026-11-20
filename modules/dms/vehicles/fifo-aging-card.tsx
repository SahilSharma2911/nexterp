"use client";

import Link from "next/link";
import { ArrowRight, Hourglass, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useVehicleAnalytics } from "./queries";

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// Fleet-wide FIFO stock-aging queue (oldest in-stock units first). Self-
// contained — used on the Vehicles page and the Allocation page.
export function FifoAgingCard({
  showAllocationLink = true,
}: {
  showAllocationLink?: boolean;
}) {
  const { data, isLoading } = useVehicleAnalytics();
  const queue = data?.fifoQueue;
  const threshold = data?.agingThreshold ?? 60;

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Hourglass className="size-4 text-muted-foreground" />
            Stock aging · FIFO
          </CardTitle>
          <div className="flex gap-6">
            <MiniStat label="Oldest" value={`${data?.oldestDays ?? 0}d`} />
            <MiniStat label="Avg age" value={`${data?.avgAgeDays ?? 0}d`} />
            <MiniStat
              label={`Aging >${threshold}d`}
              value={data?.agingCount ?? 0}
              tone={(data?.agingCount ?? 0) > 0 ? "warning" : undefined}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Allocate the oldest matching unit first — the top one is next in
            line.
          </p>
          {showAllocationLink && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dms/allocation">
                <Workflow className="size-4" />
                FIFO allocation
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !queue || queue.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No units in stock.</p>
        ) : (
          <ul className="divide-y">
            {queue.map((v, i) => {
              const aging = v.daysInStock > threshold;
              return (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <Link
                    href={`/dms/vehicles/${v.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {v.vin}
                  </Link>
                  <span className="text-muted-foreground">
                    {[v.model, v.variant].filter(Boolean).join(" · ")}
                  </span>
                  {v.warehouse && (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {v.warehouse}
                    </span>
                  )}
                  {i === 0 && (
                    <Badge className="gap-1">
                      <ArrowRight className="size-3" />
                      Next to allocate
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "ml-auto text-xs tabular-nums",
                      aging
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {v.daysInStock}d in stock
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
