"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Barcode } from "@/components/barcode";
import { fmtQty } from "@/lib/format";
import { fmtDate } from "./columns";
import { useBatches } from "./queries";

// A printable sheet of batch barcode labels. The app chrome is hidden on print
// (see globals.css @media print), so the browser prints just this grid.
export function BatchLabels() {
  const { data, isFetching } = useBatches({
    page: 1,
    limit: 200,
    q: "",
    sort: "",
    expiry: "",
  });
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} label{rows.length === 1 ? "" : "s"} — one per batch. Use
          your browser&apos;s print dialog to print or save as PDF.
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      {isFetching && !data ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No batches to print.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((b) => (
            <div
              key={b.id}
              className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center"
            >
              <p className="text-xs font-medium leading-tight">{b.itemName}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {b.itemCode}
              </p>
              <Barcode value={b.barcode || b.batchNo} height={44} />
              <p className="text-[11px] text-muted-foreground">
                Qty {fmtQty(b.onHand)}
                {b.expiryDate ? ` · Exp ${fmtDate(b.expiryDate)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
