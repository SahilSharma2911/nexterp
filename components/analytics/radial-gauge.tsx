"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export type GaugeBand = { min: number; label: string; color: string };

// Default bands suit a 0–100 "health" score (battery SoH, utilisation…).
export const HEALTH_BANDS: GaugeBand[] = [
  { min: 90, label: "Excellent", color: "#10b981" },
  { min: 75, label: "Good", color: "#2563eb" },
  { min: 60, label: "Fair", color: "#f59e0b" },
  { min: 0, label: "Needs attention", color: "#ef4444" },
];

// A semicircular gauge with an animated arc, centred value and band label.
export function RadialGauge({
  value,
  max = 100,
  suffix = "%",
  caption,
  bands = HEALTH_BANDS,
  className,
}: {
  value: number | null;
  max?: number;
  suffix?: string;
  caption?: string;
  bands?: GaugeBand[];
  className?: string;
}) {
  const grad = `gauge-${useId().replace(/:/g, "")}`;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const pct = value == null ? 0 : Math.min(1, Math.max(0, value / max));
  const band = value == null ? null : bands.find((b) => value >= b.min) ?? bands.at(-1)!;
  const color = band?.color ?? "#94a3b8";
  // Arc geometry: radius 80, half circumference ≈ 251.3
  const len = Math.PI * 80;
  const angle = Math.PI * (1 - (shown ? pct : 0));
  const knob = { x: 100 + 80 * Math.cos(angle), y: 100 - 80 * Math.sin(angle) };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-full max-w-[240px]">
        <svg viewBox="0 0 200 116" className="w-full overflow-visible">
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={color} stopOpacity="0.55" />
              <stop offset="1" stopColor={color} />
            </linearGradient>
          </defs>
          <path d="M20 100a80 80 0 0 1 160 0" fill="none" className="stroke-muted" strokeWidth="16" strokeLinecap="round" />
          {[0.25, 0.5, 0.75].map((t) => {
            const a = Math.PI * (1 - t);
            return (
              <line
                key={t}
                x1={100 + 64 * Math.cos(a)}
                y1={100 - 64 * Math.sin(a)}
                x2={100 + 58 * Math.cos(a)}
                y2={100 - 58 * Math.sin(a)}
                className="stroke-muted-foreground/40"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          <path
            d="M20 100a80 80 0 0 1 160 0"
            fill="none"
            stroke={`url(#${grad})`}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - (shown ? pct : 0))}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
          />
          {value != null && (
            <circle
              cx={knob.x}
              cy={knob.y}
              r="9"
              fill="var(--card)"
              stroke={color}
              strokeWidth="4"
              style={{ transition: "cx 900ms cubic-bezier(.2,.8,.2,1), cy 900ms cubic-bezier(.2,.8,.2,1)" }}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-[34px] leading-none font-extrabold tabular-nums">
            {value == null ? "—" : `${value.toFixed(1)}${suffix}`}
          </span>
        </div>
      </div>
      {band && (
        <span
          className="mt-3 rounded-full px-3 py-1 text-xs font-bold"
          style={{ color, background: `${color}1a` }}
        >
          {band.label}
        </span>
      )}
      {caption && <p className="mt-2 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}
