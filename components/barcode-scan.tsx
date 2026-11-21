"use client";

import { useState } from "react";
import { ScanLine, Camera } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeCameraScanner } from "@/components/barcode-scanner";
import { fetchItemByBarcode } from "@/features/items/api";
import type { ItemOption } from "@/features/items/schema";

// A scan/enter-barcode box that resolves to an Item and hands it back.
// Barcode guns type the code then press Enter, so Enter triggers the lookup.
export function BarcodeScan({
  onItem,
  placeholder = "Scan or enter barcode / code…",
  className,
}: {
  onItem: (item: ItemOption) => void;
  placeholder?: string;
  className?: string;
}) {
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
        onItem(item);
        setCode("");
      } else {
        toast.error(`No item found for "${c}"`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Barcode lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder={placeholder}
            className="pl-8"
            aria-label="Barcode"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || !code.trim()}
          onClick={() => lookup()}
        >
          {busy ? "…" : "Add"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          title="Scan with camera"
          onClick={() => setScanOpen(true)}
        >
          <Camera className="size-4" />
        </Button>
      </div>

      {scanOpen && (
        <BarcodeCameraScanner
          title="Scan an item"
          onClose={() => setScanOpen(false)}
          onDetected={(c) => {
            setScanOpen(false);
            lookup(c);
          }}
        />
      )}
    </div>
  );
}
