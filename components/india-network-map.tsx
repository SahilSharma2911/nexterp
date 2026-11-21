"use client";

import { useState } from "react";
import indiaMap from "@svg-maps/india";
import { cn } from "@/lib/utils";

// India state outlines: @svg-maps/india (CC BY 4.0, © Victor Cazanave).
// The artwork is a plain lat/long grid, so a linear projection places pins.

type SvgMap = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};
const india = indiaMap as unknown as SvgMap;

const LNG0 = 68.1;
const LNG1 = 97.4;
const LAT0 = 37.1;
const LAT1 = 6.75;
const [, , VB_W, VB_H] = india.viewBox.split(" ").map(Number);

function project(lat: number, lng: number) {
  return {
    x: ((lng - LNG0) / (LNG1 - LNG0)) * VB_W,
    y: ((LAT0 - lat) / (LAT0 - LAT1)) * VB_H,
  };
}

const CITY: Record<string, [number, number]> = {
  mumbai: [19.08, 72.88], pune: [18.52, 73.86], nagpur: [21.15, 79.09],
  nashik: [20.0, 73.79], delhi: [28.61, 77.21], "new delhi": [28.61, 77.21],
  gurugram: [28.46, 77.03], gurgaon: [28.46, 77.03], noida: [28.54, 77.39],
  bengaluru: [12.97, 77.59], bangalore: [12.97, 77.59], mysuru: [12.3, 76.64],
  chennai: [13.08, 80.27], coimbatore: [11.02, 76.96], madurai: [9.93, 78.12],
  hyderabad: [17.39, 78.49], kolkata: [22.57, 88.36], ahmedabad: [23.02, 72.57],
  surat: [21.17, 72.83], vadodara: [22.31, 73.18], rajkot: [22.3, 70.8],
  jaipur: [26.91, 75.79], udaipur: [24.59, 73.71], jodhpur: [26.24, 73.02],
  lucknow: [26.85, 80.95], kanpur: [26.45, 80.33], varanasi: [25.32, 82.97],
  agra: [27.18, 78.01], patna: [25.59, 85.14], bhopal: [23.26, 77.41],
  indore: [22.72, 75.86], raipur: [21.25, 81.63], bhubaneswar: [20.3, 85.82],
  ranchi: [23.34, 85.31], guwahati: [26.14, 91.74], chandigarh: [30.73, 76.78],
  ludhiana: [30.9, 75.86], amritsar: [31.63, 74.87], dehradun: [30.32, 78.03],
  shimla: [31.1, 77.17], srinagar: [34.08, 74.8], jammu: [32.73, 74.86],
  kochi: [9.93, 76.27], thiruvananthapuram: [8.52, 76.94], goa: [15.49, 73.83],
  panaji: [15.49, 73.83], visakhapatnam: [17.69, 83.22], vijayawada: [16.51, 80.65],
};

// State code (as used by the map) → capital, for dealers without a known city.
const STATE: Record<string, [number, number]> = {
  an: [11.62, 92.73], ap: [16.51, 80.65], ar: [27.08, 93.61], as: [26.14, 91.79],
  br: [25.59, 85.14], ch: [30.73, 76.78], ct: [21.25, 81.63], dn: [20.27, 73.02],
  dd: [20.42, 72.83], dl: [28.61, 77.21], ga: [15.49, 73.83], gj: [23.22, 72.65],
  hr: [30.73, 76.78], hp: [31.1, 77.17], jk: [34.08, 74.8], jh: [23.34, 85.31],
  ka: [12.97, 77.59], kl: [8.52, 76.94], ld: [10.57, 72.64], mp: [23.26, 77.41],
  mh: [19.08, 72.88], mn: [24.82, 93.94], ml: [25.58, 91.89], mz: [23.73, 92.72],
  nl: [25.67, 94.11], or: [20.3, 85.82], py: [11.94, 79.81], pb: [30.73, 76.78],
  rj: [26.91, 75.79], sk: [27.33, 88.61], tn: [13.08, 80.27], tg: [17.39, 78.49],
  tr: [23.83, 91.28], up: [26.85, 80.95], ut: [30.32, 78.03], wb: [22.57, 88.36],
};

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  india.locations.map((l) => [l.name.toLowerCase(), l.id]),
);
const ALIASES: Record<string, string> = { od: "or", ts: "tg", cg: "ct", uk: "ut" };

function stateCode(state?: string | null) {
  const s = (state ?? "").trim().toLowerCase();
  if (!s) return null;
  if (STATE[s]) return s;
  if (ALIASES[s]) return ALIASES[s];
  return NAME_TO_CODE[s] ?? null;
}

export type MapDealer = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  vehicles: number;
};

const PIN_COLORS = ["#2563eb", "#f97316", "#7c3aed", "#10b981", "#06b6d4", "#ec4899"];

export function IndiaNetworkMap({
  dealers,
  className,
}: {
  dealers: MapDealer[];
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const pins = dealers
    .map((d, i) => {
      const code = stateCode(d.state);
      const ll = CITY[(d.city ?? "").trim().toLowerCase()] ?? (code ? STATE[code] : undefined);
      if (!ll) return null;
      return { ...d, code, color: PIN_COLORS[i % PIN_COLORS.length], ...project(ll[0], ll[1]) };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const activeStates = new Set(pins.map((p) => p.code).filter(Boolean));
  const max = Math.max(1, ...pins.map((p) => p.vehicles));
  const hovered = pins.find((p) => p.id === hover);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={india.viewBox}
        className="h-full w-full"
        role="img"
        aria-label={`Map of India with ${pins.length} dealer location${pins.length === 1 ? "" : "s"}`}
      >
        <defs>
          <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1e3a8a" floodOpacity="0.3" />
          </filter>
        </defs>
        <g>
          {india.locations.map((l) => (
            <path
              key={l.id}
              d={l.path}
              className={cn(
                "stroke-white transition-colors dark:stroke-slate-900",
                activeStates.has(l.id)
                  ? "fill-blue-200 dark:fill-blue-500/40"
                  : "fill-slate-200/80 dark:fill-slate-700/60",
              )}
              strokeWidth={0.8}
            >
              <title>{l.name}</title>
            </path>
          ))}
        </g>
        {pins.map((p) => {
          const r = 20 + (p.vehicles / max) * 10;
          return (
            <g
              key={p.id}
              transform={`translate(${p.x} ${p.y})`}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            >
              <circle r={r + 9} fill={p.color} opacity="0.16">
                <animate attributeName="r" values={`${r};${r + 14};${r}`} dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.28;0;0.28" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <circle r={r} fill={p.color} stroke="#fff" strokeWidth="3" filter="url(#pin-glow)" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={r * 0.95}
                fontWeight="700"
              >
                {p.vehicles}
              </text>
              <text
                y={r + 26}
                textAnchor="middle"
                fontSize="26"
                fontWeight="800"
                className="fill-slate-700 stroke-white dark:fill-slate-100 dark:stroke-slate-900"
                strokeWidth="6"
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {p.city ?? p.state}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold">{hovered.name}</p>
          <p className="text-muted-foreground">
            {[hovered.city, hovered.state].filter(Boolean).join(", ")} · {hovered.vehicles} vehicle
            {hovered.vehicles === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
