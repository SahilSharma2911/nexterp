"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Barcode } from "@/components/barcode";

export type LabelSpec = {
  title: string;
  subtitle?: string;
  code: string;
  footer?: string;
};

// Reusable printable barcode-label sheet with a Copies control. Each label is
// repeated `copies` times; the app chrome is hidden on print (globals @media print).
export function BarcodeLabelSheet({
  labels,
  defaultCopies = 1,
  copiesLabel = "Copies",
  backHref,
  intro,
}: {
  labels: LabelSpec[];
  defaultCopies?: number;
  copiesLabel?: string;
  backHref?: string;
  intro?: string;
}) {
  const [copies, setCopies] = useState(defaultCopies);
  const n = Math.max(1, Math.min(200, copies || 1));
  const cells = labels.flatMap((l) => Array.from({ length: n }, () => l));

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        {backHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Label htmlFor="label-copies" className="text-xs">
            {copiesLabel}
          </Label>
          <Input
            id="label-copies"
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

      {intro && <p className="no-print text-sm text-muted-foreground">{intro}</p>}

      {cells.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to print.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cells.map((l, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center"
            >
              <p className="truncate text-xs font-medium leading-tight">
                {l.title}
              </p>
              {l.subtitle && (
                <p className="font-mono text-[11px] text-muted-foreground">
                  {l.subtitle}
                </p>
              )}
              <Barcode value={l.code} height={44} />
              {l.footer && (
                <p className="text-[11px] text-muted-foreground">{l.footer}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
