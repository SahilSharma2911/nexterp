"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ScanLine, Hash, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchSerialByBarcode } from "./api";
import { SerialStatusBadge } from "./columns";
import type { Serial } from "./schema";

// Scan a serial barcode (or serial number) to pull up the exact unit.
export function SerialScanPanel() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [serial, setSerial] = useState<Serial | null>(null);

  async function lookup() {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    try {
      const s = await fetchSerialByBarcode(c);
      if (s) {
        setSerial(s);
        setCode("");
      } else {
        toast.error(`No unit found for "${c}"`);
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
          Scan a serial
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
            placeholder="Scan a serial barcode or number…"
            className="max-w-sm font-mono"
          />
          <Button variant="outline" onClick={lookup} disabled={busy}>
            {busy ? "Looking up…" : "Find"}
          </Button>
        </div>

        {serial && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
            <Hash className="size-5 text-muted-foreground" />
            <div className="min-w-0">
              <Link
                href={`/stock/serials/${serial.id}`}
                className="font-mono text-sm font-medium text-primary hover:underline"
              >
                {serial.serialNo}
              </Link>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{serial.itemCode}</span>{" "}
                {serial.itemName}
                {serial.warehouseName ? ` · ${serial.warehouseName}` : ""}
              </p>
            </div>
            <SerialStatusBadge status={serial.status} />
            <Button asChild size="sm" className="ml-auto">
              <Link href={`/stock/serials/${serial.id}`}>
                Open unit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
