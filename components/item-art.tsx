import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Product "cutout" illustrations for accessories and spare parts that have no
// photo. The drawing is picked from the item's name / group.

export type ItemKind =
  | "helmet"
  | "mat"
  | "seat"
  | "brake"
  | "charger"
  | "bottle"
  | "battery"
  | "tyre"
  | "mirror"
  | "gloves"
  | "lock"
  | "light"
  | "phone"
  | "cover"
  | "box";

const RULES: [RegExp, ItemKind][] = [
  [/helmet/, "helmet"],
  [/mat\b|mats|carpet/, "mat"],
  [/seat/, "seat"],
  [/brake|pad|disc|rotor/, "brake"],
  [/charger|charging|adapter|cable|plug/, "charger"],
  [/coolant|oil|fluid|lubricant|grease|liquid|polish|shampoo/, "bottle"],
  [/battery|cell|bms/, "battery"],
  [/tyre|tire|wheel|tube|rim/, "tyre"],
  [/mirror/, "mirror"],
  [/glove/, "gloves"],
  [/lock|guard|alarm/, "lock"],
  [/light|lamp|bulb|led|indicator/, "light"],
  [/phone|mobile|holder|mount|usb/, "phone"],
  [/cover|tarp|body cover/, "cover"],
];

export function itemKind(name?: string | null, group?: string | null): ItemKind {
  const s = `${name ?? ""} ${group ?? ""}`.toLowerCase();
  for (const [re, kind] of RULES) if (re.test(s)) return kind;
  return "box";
}

// Tile tint per kind — keeps each product visually distinct in a list.
const TILE: Record<ItemKind, string> = {
  helmet: "from-blue-50 to-indigo-100 dark:from-blue-500/15 dark:to-indigo-500/10",
  mat: "from-slate-50 to-slate-200 dark:from-slate-700/50 dark:to-slate-800",
  seat: "from-amber-50 to-orange-100 dark:from-amber-500/15 dark:to-orange-500/10",
  brake: "from-rose-50 to-red-100 dark:from-rose-500/15 dark:to-red-500/10",
  charger: "from-emerald-50 to-teal-100 dark:from-emerald-500/15 dark:to-teal-500/10",
  bottle: "from-cyan-50 to-sky-100 dark:from-cyan-500/15 dark:to-sky-500/10",
  battery: "from-lime-50 to-emerald-100 dark:from-lime-500/15 dark:to-emerald-500/10",
  tyre: "from-zinc-50 to-zinc-200 dark:from-zinc-700/50 dark:to-zinc-800",
  mirror: "from-sky-50 to-blue-100 dark:from-sky-500/15 dark:to-blue-500/10",
  gloves: "from-orange-50 to-amber-100 dark:from-orange-500/15 dark:to-amber-500/10",
  lock: "from-yellow-50 to-amber-100 dark:from-yellow-500/15 dark:to-amber-500/10",
  light: "from-yellow-50 to-yellow-100 dark:from-yellow-500/15 dark:to-yellow-500/10",
  phone: "from-violet-50 to-purple-100 dark:from-violet-500/15 dark:to-purple-500/10",
  cover: "from-indigo-50 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/10",
  box: "from-orange-50 to-amber-100 dark:from-orange-500/15 dark:to-amber-500/10",
};

export function ItemArt({
  name,
  group,
  kind,
  className,
}: {
  name?: string | null;
  group?: string | null;
  kind?: ItemKind;
  className?: string;
}) {
  const k = kind ?? itemKind(name, group);
  const g = useId().replace(/:/g, "");
  const shine = `shine-${g}`;

  return (
    <svg viewBox="0 0 64 64" className={cn("size-full", className)} role="img" aria-label={name ?? k}>
      <defs>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="57" rx="20" ry="3" fill="#0f172a" opacity="0.14" />

      {k === "helmet" && (
        <g>
          <path d="M10 40c0-15 10-26 24-26 12 0 21 9 21 21v6H10z" fill="#2563eb" />
          <path d="M34 22c8 0 14 6 15 14H31c-3 0-5-2-5-5v-1c0-5 3-8 8-8z" fill="#0f172a" opacity="0.85" />
          <path d="M14 30c3-8 10-13 18-13" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" fill="none" />
          <rect x="9" y="40" width="47" height="6" rx="3" fill="#1e3a8a" />
          <path d="M20 46v4c0 2 2 3 4 3h3" stroke="#334155" strokeWidth="2" fill="none" />
        </g>
      )}

      {k === "mat" && (
        <g>
          <path d="M14 12h30l6 6v30c0 3-2 5-5 5H14c-3 0-5-2-5-5V17c0-3 2-5 5-5z" fill="#334155" transform="rotate(-6 32 32)" />
          <path d="M17 16h26l4 4v26c0 2-1 3-3 3H17c-2 0-3-1-3-3V19c0-2 1-3 3-3z" fill="#475569" transform="rotate(-6 32 32)" />
          <g stroke="#64748b" strokeWidth="1.6" transform="rotate(-6 32 32)">
            {[22, 27, 32, 37, 42].map((y) => (
              <path key={y} d={`M18 ${y}h26`} />
            ))}
          </g>
        </g>
      )}

      {k === "seat" && (
        <g>
          <path d="M22 8h18c4 0 6 3 6 7l-2 22H18l-2-22c0-4 2-7 6-7z" fill="#f59e0b" />
          <path d="M26 12h10c2 0 3 2 3 4l-1 17H24l-1-17c0-2 1-4 3-4z" fill="#b45309" opacity="0.5" />
          <path d="M14 38h36c3 0 4 2 4 4v3c0 3-2 5-5 5H15c-3 0-5-2-5-5v-3c0-2 2-4 4-4z" fill="#d97706" />
          <path d="M16 41h32" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="2 3" />
          <path d="M22 50v5M42 50v5" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {k === "brake" && (
        <g>
          <circle cx="32" cy="32" r="22" fill="#cbd5e1" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} cx={32 + Math.cos(a) * 15} cy={32 + Math.sin(a) * 15} r="1.8" fill="#64748b" />;
          })}
          <circle cx="32" cy="32" r="8" fill="#64748b" />
          <circle cx="32" cy="32" r="3" fill="#334155" />
          <path d="M42 12c8 4 13 12 13 20s-3 13-8 17l-6-6c3-3 5-7 5-11 0-5-3-10-8-13z" fill="#dc2626" />
          <path d="M45 18c4 3 6 8 6 13" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {k === "charger" && (
        <g>
          <rect x="16" y="14" width="26" height="32" rx="6" fill="#10b981" />
          <rect x="16" y="14" width="26" height="12" rx="6" fill={`url(#${shine})`} />
          <path d="M31 21l-6 10h5l-2 8 7-11h-5l2-7z" fill="#fff" />
          <path d="M29 46v4c0 4 3 6 7 6h10c4 0 6-2 6-6v-8" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="48" y="34" width="8" height="9" rx="2" fill="#1f2937" />
          <path d="M50 30v4M54 30v4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {k === "bottle" && (
        <g>
          <rect x="27" y="6" width="10" height="7" rx="2" fill="#0e7490" />
          <path d="M24 13h16l3 7v30c0 3-2 5-5 5H26c-3 0-5-2-5-5V20z" fill="#06b6d4" />
          <rect x="24" y="27" width="16" height="16" rx="2" fill="#fff" opacity="0.9" />
          <path d="M32 30c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#06b6d4" />
          <path d="M25 18v28" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {k === "battery" && (
        <g>
          <rect x="12" y="16" width="40" height="34" rx="5" fill="#1f2937" />
          <rect x="18" y="11" width="8" height="6" rx="1.5" fill="#64748b" />
          <rect x="38" y="11" width="8" height="6" rx="1.5" fill="#64748b" />
          <rect x="17" y="22" width="30" height="8" rx="2" fill="#22c55e" />
          <path d="M34 33l-6 9h5l-2 6 7-10h-5l2-5z" fill="#facc15" />
          <rect x="12" y="16" width="40" height="8" rx="5" fill={`url(#${shine})`} />
        </g>
      )}

      {k === "tyre" && (
        <g>
          <circle cx="32" cy="32" r="23" fill="#1f2937" />
          <circle cx="32" cy="32" r="23" fill="none" stroke="#374151" strokeWidth="4" strokeDasharray="3 3" />
          <circle cx="32" cy="32" r="13" fill="#cbd5e1" />
          {Array.from({ length: 5 }).map((_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return <path key={i} d={`M32 32L${32 + Math.cos(a) * 12} ${32 + Math.sin(a) * 12}`} stroke="#94a3b8" strokeWidth="3" />;
          })}
          <circle cx="32" cy="32" r="4" fill="#475569" />
        </g>
      )}

      {k === "mirror" && (
        <g>
          <path d="M30 40l-6 14" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="36" cy="24" rx="20" ry="14" fill="#1f2937" transform="rotate(-12 36 24)" />
          <ellipse cx="36" cy="24" rx="16" ry="10.5" fill="#93c5fd" transform="rotate(-12 36 24)" />
          <path d="M26 20c4-5 10-7 16-6" stroke="#fff" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {k === "gloves" && (
        <g>
          <path d="M20 54V30l-4-10c-1-2 2-4 4-2l4 8V12c0-3 4-3 4 0v12-15c0-3 4-3 4 0v15-12c0-3 4-3 4 0v14-9c0-3 4-3 4 0v19c0 6-2 10-6 13v5z" fill="#f97316" />
          <rect x="19" y="47" width="22" height="8" rx="2" fill="#1f2937" />
          <path d="M26 26v10M31 26v10" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {k === "lock" && (
        <g>
          <path d="M22 28v-8a10 10 0 0 1 20 0v8" stroke="#94a3b8" strokeWidth="5" fill="none" />
          <rect x="14" y="27" width="36" height="26" rx="5" fill="#eab308" />
          <rect x="14" y="27" width="36" height="9" rx="5" fill={`url(#${shine})`} />
          <circle cx="32" cy="38" r="3.5" fill="#713f12" />
          <rect x="30.5" y="39" width="3" height="8" rx="1.5" fill="#713f12" />
        </g>
      )}

      {k === "light" && (
        <g>
          <path d="M12 22c0-6 5-10 12-10h6v34h-6c-7 0-12-4-12-10z" fill="#334155" />
          <ellipse cx="30" cy="29" rx="6" ry="17" fill="#fde68a" />
          <ellipse cx="30" cy="29" rx="3.5" ry="11" fill="#fff" />
          <path d="M40 18l14-5M41 29h15M40 40l14 5" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {k === "phone" && (
        <g>
          <path d="M32 46v8M24 56h16" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          <rect x="16" y="8" width="32" height="40" rx="5" fill="#1f2937" />
          <rect x="21" y="12" width="22" height="32" rx="3" fill="#8b5cf6" />
          <rect x="21" y="12" width="22" height="12" rx="3" fill={`url(#${shine})`} />
          <path d="M12 20v16M52 20v16" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {k === "cover" && (
        <g>
          <path d="M8 44c2-10 8-18 18-20l6-8h10c6 0 10 6 12 14l2 14c0 3-2 5-5 5H13c-3 0-5-2-5-5z" fill="#6366f1" />
          <path d="M12 46c10-2 30-2 42 0" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <path d="M28 24l6-6h7c3 0 6 4 7 10" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {k === "box" && (
        <g>
          <path d="M32 8l22 10v26L32 54 10 44V18z" fill="#f59e0b" />
          <path d="M32 30L10 18l22-10 22 10z" fill="#fcd34d" />
          <path d="M32 30v24" stroke="#b45309" strokeWidth="1.5" />
          <path d="M21 13l22 11v8" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" fill="none" />
        </g>
      )}
    </svg>
  );
}

// Real product photos (public/items, from Pexels — see CREDITS.md) used as the
// default picture for an item type; `focus` is the crop's object-position.
const KIND_PHOTO: Partial<Record<ItemKind, { src: string; focus: string }>> = {
  helmet: { src: "/items/helmet.jpg", focus: "50% 72%" },
  brake: { src: "/items/brake.jpg", focus: "45% 55%" },
  bottle: { src: "/items/bottle.jpg", focus: "50% 35%" },
  mat: { src: "/items/mat.jpg", focus: "50% 50%" },
  seat: { src: "/items/seat.jpg", focus: "40% 40%" },
  charger: { src: "/items/charger.jpg", focus: "50% 50%" },
};

export function itemPhoto(name?: string | null, group?: string | null) {
  return KIND_PHOTO[itemKind(name, group)]?.src ?? null;
}

export function ItemThumb({
  imageUrl,
  name,
  group,
  className,
}: {
  imageUrl?: string | null;
  name?: string | null;
  group?: string | null;
  className?: string;
}) {
  const k = itemKind(name, group);
  const photo = imageUrl ? { src: imageUrl, focus: "50% 50%" } : KIND_PHOTO[k];
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-black/5 dark:ring-white/10",
        TILE[k],
        className,
      )}
    >
      {photo ? (
        <Image
          src={photo.src}
          alt={name ?? ""}
          fill
          sizes="(min-width: 1024px) 240px, 50vw"
          className="object-cover"
          style={{ objectPosition: photo.focus }}
          unoptimized
        />
      ) : (
        <ItemArt kind={k} name={name} className="p-1" />
      )}
    </span>
  );
}
