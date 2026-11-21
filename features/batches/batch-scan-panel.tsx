"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ScanLine, Boxes, ArrowRight, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeCameraScanner } from "@/components/barcode-scanner";
import { fmtQty } from "@/lib/format";
import { fetchBatchByBarcode } from "./api";
import { ExpiryBadge, fmtDate } from "./columns";
import type { Batch } from "./schema";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium">{children}</p>
    </div>
  );
}

// Scan a batch barcode (or lot number) to pull up the exact lot and its expiry.
export function BatchScanPanel() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);

  async function lookup(raw?: string) {
    const c = (raw ?? code).trim();
    if (!c || busy) return;
    setBusy(true);
    try {
      const b = await fetchBatchByBarcode(c);
      if (b) {
        setBatch(b);
        setCode("");
      } else {
        toast.error(`No batch found for "${c}"`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScanLine className="size-4 text-muted-foreground" />
          Scan a batch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder="Scan a batch barcode or lot number…"
            className="max-w-sm font-mono"
          />
          <Button variant="outline" onClick={() => lookup()} disabled={busy}>
            {busy ? "Looking up…" : "Find"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Scan with camera"
            onClick={() => setScanOpen(true)}
          >
            <Camera className="size-4" />
          </Button>
        </div>

        {scanOpen && (
          <BarcodeCameraScanner
            title="Scan a batch"
            onClose={() => setScanOpen(false)}
            onDetected={(c) => {
              setScanOpen(false);
              setCode(c);
              lookup(c);
            }}
          />
        )}

        {batch && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Boxes className="size-5 text-muted-foreground" />
              <Link
                href={`/stock/batches/${batch.id}`}
                className="font-mono text-base font-semibold text-primary hover:underline"
              >
                {batch.batchNo}
              </Link>
              <ExpiryBadge status={batch.expiry} days={batch.daysToExpiry} />
              <Button asChild size="sm" className="ml-auto">
                <Link href={`/stock/batches/${batch.id}`}>
                  Open batch
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <Field label="Item">
                <span className="font-mono text-xs">{batch.itemCode}</span>{" "}
                {batch.itemName}
              </Field>
              <Field label="On hand">{fmtQty(batch.onHand)}</Field>
              <Field label="Received">{fmtQty(batch.qty)}</Field>
              <Field label="Warehouse">{batch.warehouseName ?? "—"}</Field>
              <Field label="Expiry">{fmtDate(batch.expiryDate)}</Field>
              <Field label="Manufactured">{fmtDate(batch.mfgDate)}</Field>
              <Field label="Supplier">{batch.supplier ?? "—"}</Field>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
