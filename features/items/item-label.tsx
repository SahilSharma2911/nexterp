"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Barcode } from "@/components/barcode";
import { useItem } from "./queries";

// A printable sheet of barcode labels for one item. Choose how many copies, then
// Print — the app chrome is hidden on print (globals.css @media print).
export function ItemLabel({ itemId }: { itemId: string }) {
  const { data: it, isLoading } = useItem(itemId);
  const [copies, setCopies] = useState(12);

  if (isLoading || !it) return <Skeleton className="h-64 w-full rounded-xl" />;

  const code = it.barcode || it.itemCode;
  const n = Math.max(1, Math.min(200, copies || 1));

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/stock/items/${it.id}`}>
            <ArrowLeft className="size-4" />
            Back to item
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Label htmlFor="copies" className="text-xs">
            Copies
          </Label>
          <Input
            id="copies"
            type="number"
            min={1}
            max={200}
            value={copies}
            onChange={(e) => setCopies(Number(e.target.value))}
            className="w-20"
          />
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      <p className="no-print text-sm text-muted-foreground">
        {n} label{n === 1 ? "" : "s"} of <span className="font-medium">{it.itemName}</span>.
        Use your browser&apos;s print dialog (set to label/A4 as needed).
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center"
          >
            <p className="truncate text-xs font-medium leading-tight">
              {it.itemName}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {it.itemCode}
            </p>
            <Barcode value={code} height={44} />
          </div>
        ))}
      </div>
    </div>
  );
}
