"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Barcode } from "@/components/barcode";
import { useVehicle } from "./queries";

// A single printable VIN tag. The app chrome is hidden on print (globals.css
// @media print), so the browser prints just the tag below.
export function VehicleLabel({ vehicleId }: { vehicleId: string }) {
  const { data: v, isLoading } = useVehicle(vehicleId);

  if (isLoading || !v) return <Skeleton className="h-64 w-full rounded-xl" />;

  const subtitle = [v.model, v.variant, v.color].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dms/vehicles/${v.id}`}>
            <ArrowLeft className="size-4" />
            Back to vehicle
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Use your browser&apos;s print dialog to print or save as PDF.
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="flex w-[22rem] flex-col items-center gap-2 rounded-lg border p-5 text-center">
          <p className="text-sm font-semibold leading-tight">{v.model}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          <Barcode value={v.vin} height={64} />
          {v.dealer && (
            <p className="text-[11px] text-muted-foreground">{v.dealer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
