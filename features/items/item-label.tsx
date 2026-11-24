"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeLabelSheet } from "@/components/barcode-label-sheet";
import { useItem } from "./queries";

// Printable barcode labels for one item, with a Copies count.
export function ItemLabel({ itemId }: { itemId: string }) {
  const { data: it, isLoading } = useItem(itemId);

  if (isLoading || !it) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <BarcodeLabelSheet
      backHref={`/stock/items/${it.id}`}
      defaultCopies={12}
      intro={`Barcode labels for ${it.itemName}. Use your browser's print dialog (set to label / A4 as needed).`}
      labels={[
        {
          title: it.itemName,
          subtitle: it.itemCode,
          code: it.barcode || it.itemCode,
        },
      ]}
    />
  );
}
