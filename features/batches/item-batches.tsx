"use client";

import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanWrite } from "@/components/session-context";
import { fmtQty } from "@/lib/format";
import { ExpiryBadge, fmtDate } from "./columns";
import { useBatchesForItem } from "./queries";

// Batches for a single item, shown on the Item detail page when the item is
// batch-tracked (Item.hasBatchNo).
export function ItemBatches({ itemId }: { itemId: string }) {
  const { data, isLoading } = useBatchesForItem(itemId);
  const canWrite = useCanWrite("stock");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Boxes className="size-4 text-muted-foreground" />
          Batches {data ? `(${data.length})` : ""}
        </CardTitle>
        {canWrite && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/stock/batches/new?item=${itemId}`}>
              <Plus className="size-4" />
              New batch
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No batches recorded for this item yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Batch / Lot</th>
                <th className="p-3 text-right font-medium">Qty</th>
                <th className="p-3 font-medium">Expiry</th>
                <th className="p-3 font-medium">Shelf life</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/stock/batches/${b.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {b.batchNo}
                    </Link>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtQty(b.qty)}
                  </td>
                  <td className="p-3 tabular-nums">{fmtDate(b.expiryDate)}</td>
                  <td className="p-3">
                    <ExpiryBadge status={b.expiry} days={b.daysToExpiry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
