"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeLabelSheet } from "@/components/barcode-label-sheet";
import { useSerials } from "./queries";

// A printable sheet of serial barcode labels, with a per-serial Copies count.
export function SerialLabels() {
  const { data, isFetching } = useSerials({
    page: 1,
    limit: 200,
    q: "",
    sort: "",
  });
  const rows = data?.rows ?? [];

  if (isFetching && !data)
    return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <BarcodeLabelSheet
      copiesLabel="Copies per serial"
      defaultCopies={1}
      intro={`${rows.length} serial${rows.length === 1 ? "" : "s"}. Each unit is unique, so one label each is usual — raise copies to reprint.`}
      labels={rows.map((s) => ({
        title: s.itemName,
        subtitle: s.serialNo,
        code: s.barcode || s.serialNo,
        footer: s.status,
      }))}
    />
  );
}
