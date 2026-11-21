import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Side-view EV "cutout" illustrations used wherever a vehicle has no photo.
// The silhouette is picked from the model name and tinted with its colour.

export type VehicleKind = "scooter" | "car" | "cargo";

export function vehicleKind(model?: string | null): VehicleKind {
  const m = (model ?? "").toLowerCase();
  if (/cargo|loader|truck|van|pickup|3w|auto|rickshaw/.test(m)) return "cargo";
  if (/city|scoot|bike|moto|2w|cycle|ride/.test(m)) return "scooter";
  return "car";
}

const KIND_TINT: Record<VehicleKind, string> = {
  scooter: "#2563eb",
  car: "#334155",
  cargo: "#f97316",
};

const COLOR_HEX: [RegExp, string][] = [
  [/white|pearl|ivory|silver/, "#e2e8f0"],
  [/black|onyx|midnight|charcoal/, "#1e293b"],
  [/grey|gray|graphite|titan/, "#64748b"],
  [/red|maroon|crimson|ruby/, "#dc2626"],
  [/orange|copper|amber/, "#f97316"],
  [/yellow|gold/, "#eab308"],
  [/green|teal|mint|olive/, "#10b981"],
  [/cyan|aqua|turquoise/, "#06b6d4"],
  [/blue|navy|cobalt|azure|sky/, "#2563eb"],
  [/purple|violet|lilac/, "#7c3aed"],
  [/pink|rose|magenta/, "#ec4899"],
];

export function vehicleTint(kind: VehicleKind, color?: string | null) {
  const c = (color ?? "").toLowerCase();
  for (const [re, hex] of COLOR_HEX) if (re.test(c)) return hex;
  return KIND_TINT[kind];
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#1f2937" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#cbd5e1" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#94a3b8" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#475569" />
    </g>
  );
}

export function VehicleArt({
  model,
  color,
  kind,
  className,
}: {
  model?: string | null;
  color?: string | null;
  kind?: VehicleKind;
  className?: string;
}) {
  const k = kind ?? vehicleKind(model);
  const tint = vehicleTint(k, color);
  const uid = useId().replace(/:/g, "");
  const body = `body-${uid}`;
  const glass = `glass-${uid}`;

  return (
    <svg
      viewBox="0 0 160 80"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={model ? `${model} illustration` : "Vehicle illustration"}
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.78" />
          <stop offset="0.45" stopColor={tint} />
          <stop offset="1" stopColor={tint} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="72" rx="66" ry="4.5" fill="#0f172a" opacity="0.12" />

      {k === "car" && (
        <g>
          <path
            d="M14 56c0-8 4-12 14-14l18-2 16-14c4-3 8-4 14-4h28c6 0 10 2 14 6l12 12 12 3c6 2 8 6 8 11v4c0 2-2 4-4 4H18c-3 0-4-2-4-4z"
            fill={`url(#${body})`}
          />
          <path d="M66 28l-8 12h34V27H76z" fill={`url(#${glass})`} />
          <path d="M96 27v13h28l-10-10c-2-2-4-3-8-3z" fill={`url(#${glass})`} />
          <path d="M94 27v34" stroke="#0f172a" strokeOpacity="0.18" />
          <path d="M18 48h128" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
          <rect x="80" y="44" width="8" height="2" rx="1" fill="#0f172a" opacity="0.3" />
          <path d="M143 46c3 0 5 2 6 5h-7z" fill="#fef9c3" />
          <rect x="14" y="47" width="4" height="5" rx="1.5" fill="#ef4444" />
          <path d="M108 50l-3 5h3l-2 4 5-6h-3l2-3z" fill="#fff" opacity="0.85" />
          <Wheel cx={40} cy={62} r={11} />
          <Wheel cx={122} cy={62} r={11} />
        </g>
      )}

      {k === "scooter" && (
        <g>
          <path d="M100 44c10-2 22 2 28 14" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path
            d="M18 56c-2-12 8-20 26-20h26c8 0 12 4 12 10v8h24l12-30h8l-12 32c-2 4-6 6-10 6H30c-6 0-11-2-12-6z"
            fill={`url(#${body})`}
          />
          <path d="M112 24h16c6 10 8 22 6 32l-8 2z" fill={`url(#${body})`} />
          <path d="M30 34c0-4 4-6 10-6h30c4 0 6 2 6 5v3H30z" fill="#1f2937" />
          <path d="M118 22l-10-8M104 13h8" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <circle cx="114" cy="11" r="2.5" fill="#334155" />
          <path d="M128 26c4 1 6 3 6 6h-5z" fill="#fef9c3" />
          <path d="M22 50h56" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
          <rect x="16" y="46" width="4" height="4" rx="1.5" fill="#ef4444" />
          <path d="M52 41l-3 5h3l-2 4 5-6h-3l2-3z" fill="#fff" opacity="0.85" />
          <Wheel cx={36} cy={62} r={11} />
          <Wheel cx={124} cy={62} r={11} />
        </g>
      )}

      {k === "cargo" && (
        <g>
          <rect x="10" y="20" width="82" height="36" rx="3" fill="#e2e8f0" />
          <rect x="10" y="20" width="82" height="36" rx="3" fill="none" stroke="#94a3b8" />
          {[26, 42, 58, 74].map((x) => (
            <path key={x} d={`M${x} 24v28`} stroke="#94a3b8" strokeOpacity="0.6" />
          ))}
          <rect x="10" y="52" width="140" height="6" rx="2" fill="#334155" />
          <path
            d="M94 56V26c0-6 4-10 12-10h18c10 0 16 8 20 20l4 14c1 4-1 6-4 6z"
            fill={`url(#${body})`}
          />
          <path d="M110 22h16c6 0 10 6 12 14v2h-28z" fill={`url(#${glass})`} />
          <path d="M98 44h46" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M144 42c3 0 4 2 5 5h-6z" fill="#fef9c3" />
          <path d="M120 44l-3 5h3l-2 4 5-6h-3l2-3z" fill="#fff" opacity="0.85" />
          <Wheel cx={36} cy={62} r={10} />
          <Wheel cx={128} cy={62} r={10} />
        </g>
      )}
    </svg>
  );
}

// Square thumbnail: the real photo when there is one, otherwise the cutout
// on a soft tinted tile.
export function VehicleThumb({
  imageUrl,
  model,
  color,
  className,
}: {
  imageUrl?: string | null;
  model?: string | null;
  color?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 ring-1 ring-slate-200/70 dark:from-slate-800 dark:to-slate-900 dark:ring-white/10",
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={model ?? ""}
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <VehicleArt model={model} color={color} className="w-[118%] max-w-none" />
      )}
    </span>
  );
}
