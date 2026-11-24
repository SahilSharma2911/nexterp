"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScanLine, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeCameraScanner } from "@/components/barcode-scanner";
import { fetchItemByBarcode } from "./api";

// Scan or type a barcode / item code to jump straight to that item — works for
// any item (quantity-only, batch or serial), since every item is scannable by
// its code.
export function ItemScanPanel() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  async function lookup(raw?: string) {
    const c = (raw ?? code).trim();
    if (!c || busy) return;
    setBusy(true);
    try {
      const item = await fetchItemByBarcode(c);
      if (item) {
        setCode("");
        router.push(`/stock/items/${item.id}`);
      } else {
        toast.error(`No item found for "${c}"`);
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
          Scan an item
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            placeholder="Scan or type a barcode / item code…"
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
          <div className="mt-4">
            <BarcodeCameraScanner
              title="Scan an item barcode"
              onClose={() => setScanOpen(false)}
              onDetected={(c) => {
                setScanOpen(false);
                setCode(c);
                lookup(c);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
