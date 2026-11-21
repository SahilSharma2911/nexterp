"use client";

import Link from "next/link";
import { Layers, AlertTriangle, CircleX, Boxes } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtQty } from "@/lib/format";
import { ExpiryBadge, fmtDate } from "./columns";
import type { BatchListItem } from "./schema";
import { useBatchAnalytics } from "./queries";

export function BatchAnalytics() {
  const { data, isLoading } = useBatchAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Batches", value: data.total, icon: Layers },
    {
      label: "Expiring soon",
      value: data.expiring,
      icon: AlertTriangle,
      tone: data.expiring > 0 ? "warning" : undefined,
      sub: "within 90 days",
    },
    {
      label: "Expired",
      value: data.expired,
      icon: CircleX,
      tone: data.expired > 0 ? "negative" : "positive",
      sub: "past shelf life",
    },
    {
      label: "Units tracked",
      value: fmtQty(data.totalQty),
      icon: Boxes,
      sub: "across all batches",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <ExpiringSoon loading={isLoading} data={data?.expiringSoon} />
    </div>
  );
}

function ExpiringSoon({
  loading,
  data,
}: {
  loading?: boolean;
  data?: BatchListItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-muted-foreground" />
          Expiring soon
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No batches expiring in the next 90 days.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <Link
                  href={`/stock/batches/${b.id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {b.batchNo}
                </Link>
                <span className="text-muted-foreground">
                  <span className="font-mono text-xs">{b.itemCode}</span>{" "}
                  {b.itemName}
                </span>
                <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">{fmtDate(b.expiryDate)}</span>
                  <ExpiryBadge status={b.expiry} days={b.daysToExpiry} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
