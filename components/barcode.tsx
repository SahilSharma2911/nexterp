"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { cn } from "@/lib/utils";

// Renders a scannable Code128 barcode (SVG) from any string. Inherits the
// current text colour, so it themes with light/dark automatically.
export function Barcode({
  value,
  height = 56,
  displayValue = true,
  className,
}: {
  value: string | null | undefined;
  height?: number;
  displayValue?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        displayValue,
        fontSize: 13,
        textMargin: 4,
        margin: 8,
        background: "transparent",
        lineColor: "currentColor",
      });
    } catch {
      /* invalid value for the symbology — render nothing */
    }
  }, [value, height, displayValue]);

  if (!value) return null;
  return <svg ref={ref} className={cn("text-foreground", className)} />;
}
