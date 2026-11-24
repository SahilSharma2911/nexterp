"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeLabelSheet } from "@/components/barcode-label-sheet";
import { fmtQty } from "@/lib/format";
import { fmtDate } from "./columns";
import { useBatches } from "./queries";

// A printable sheet of batch barcode labels, with a per-batch Copies count.
export function BatchLabels() {
  const { data, isFetching } = useBatches({
    page: 1,
    limit: 200,
    q: "",
    sort: "",
    expiry: "",
  });
  const rows = data?.rows ?? [];

  if (isFetching && !data)
    return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <BarcodeLabelSheet
      copiesLabel="Copies per batch"
      defaultCopies={1}
      intro={`${rows.length} batch${rows.length === 1 ? "" : "es"}. Set how many labels to print for each, then use your browser's print dialog.`}
      labels={rows.map((b) => ({
        title: b.itemName,
        subtitle: b.itemCode,
        code: b.barcode || b.batchNo,
        footer:
          `Qty ${fmtQty(b.onHand)}` +
          (b.expiryDate ? ` · Exp ${fmtDate(b.expiryDate)}` : ""),
      }))}
    />
  );
}
