"use client";

import Link from "next/link";
import { Hash, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanWrite } from "@/components/session-context";
import { SerialStatusBadge } from "./columns";
import { useSerialsForItem } from "./queries";

// Serials for a single item, shown on the Item detail page when the item is
// serial-tracked (Item.hasSerialNo).
export function ItemSerials({ itemId }: { itemId: string }) {
  const { data, isLoading } = useSerialsForItem(itemId);
  const canWrite = useCanWrite("stock");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Hash className="size-4 text-muted-foreground" />
          Serial numbers {data ? `(${data.length})` : ""}
        </CardTitle>
        {canWrite && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/stock/serials/new?item=${itemId}`}>
              <Plus className="size-4" />
              New serial
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
            No serial numbers recorded for this item yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Serial</th>
                <th className="p-3 font-medium">Warehouse</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/stock/serials/${s.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {s.serialNo}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.warehouseName ?? "—"}
                  </td>
                  <td className="p-3">
                    <SerialStatusBadge status={s.status} />
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
