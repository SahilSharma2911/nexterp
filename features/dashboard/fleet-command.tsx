"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Car,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  RefreshCw,
  Store,
  Timer,
  Trophy,
  IndianRupee,
  CalendarClock,
  Truck,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { VehicleArt, VehicleThumb } from "@/components/vehicle-art";
import { IndiaNetworkMap } from "@/components/india-network-map";
import { RadialGauge } from "@/components/analytics/radial-gauge";
import { useJobCardAnalytics } from "@/modules/dms/job-cards/queries";
import { useAppointmentAnalytics } from "@/modules/dms/service-appointments/queries";
import { useSession } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { useVehicleAnalytics, useVehicles } from "@/modules/dms/vehicles/queries";
import { useDealerAnalytics } from "@/modules/dms/dealers/queries";
import { StatusBadge } from "@/modules/dms/vehicles/columns";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_COLORS,
  VEHICLE_STATUS_LABELS,
  type VehicleStatus,
} from "@/modules/dms/vehicles/schema";

const STAGE: Record<VehicleStatus, { color: string; icon: React.ElementType; chip: string }> = {
  IN_STOCK: { color: "#10b981", icon: Warehouse, chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
  ALLOCATED: { color: "#f59e0b", icon: ClipboardCheck, chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
  IN_TRANSIT: { color: "#f97316", icon: Truck, chip: "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300" },
  AT_DEALER: { color: "#8b5cf6", icon: Store, chip: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  PDI_DONE: { color: "#06b6d4", icon: BadgeCheck, chip: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300" },
  DELIVERED: { color: "#2563eb", icon: PackageCheck, chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" },
  IN_SERVICE: { color: "#ec4899", icon: Wrench, chip: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300" },
};

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

function pct(part: number, total: number) {
  return total ? `${((part / total) * 100).toFixed(1)}% of fleet` : "—";
}

function PanelTitle({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href?: string;
  icon?: React.ElementType;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
      <CardTitle className="flex items-center gap-2 text-sm font-bold">
        {Icon && <Icon className="size-4 text-primary" />}
        {title}
      </CardTitle>
      {href && (
        <Link href={href} className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      )}
    </CardHeader>
  );
}

// Faint skyline + turbines behind the hero cutouts.
function Skyline() {
  const blocks = [
    [0, 46, 22], [26, 30, 18], [48, 54, 26], [78, 38, 16], [98, 62, 24],
    [126, 26, 20], [150, 48, 18], [172, 70, 28], [204, 34, 16], [224, 52, 22],
    [250, 40, 18], [272, 58, 24], [300, 30, 18], [322, 66, 26], [352, 44, 20],
  ];
  return (
    <svg viewBox="0 0 380 90" className="absolute inset-x-0 bottom-0 h-24 w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <g className="fill-blue-200/35 dark:fill-blue-300/[0.05]">
        {blocks.map(([x, h, w]) => (
          <rect key={x} x={x} y={90 - h} width={w} height={h} rx="1.5" />
        ))}
      </g>
      <g className="stroke-blue-300/60 dark:stroke-blue-300/10" strokeWidth="1.2" fill="none">
        <path d="M60 90V40M60 40l-9 -6M60 40l10 -3M60 40l-1 11" />
        <path d="M290 90V36M290 36l-9 -6M290 36l10 -3M290 36l-1 11" />
      </g>
      <rect x="0" y="86" width="380" height="4" className="fill-blue-200/70 dark:fill-blue-300/10" />
    </svg>
  );
}

function FleetHero({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const user = useSession();
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/40 dark:via-card dark:to-indigo-950/30">
      <Skyline />
      <div className="relative grid items-end gap-4 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
        <div className="pb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[10.5px] font-bold tracking-[0.14em] text-primary uppercase dark:border-blue-400/30 dark:bg-white/5">
            <Zap className="size-3 fill-current" />
            Fleet command
          </span>
          <h1 className="mt-3 text-[28px] leading-tight font-extrabold tracking-tight md:text-[32px]">
            Welcome back, {user.name.split(" ")[0]}.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              Your network, live.
            </span>
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Every vehicle from warehouse to customer delivery, across all your
            dealerships, in one view.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-lg shadow-[0_8px_20px_-8px_rgb(37_99_235/0.8)]">
              <Link href="/dms/vehicles">
                Open fleet <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg bg-white/70 dark:bg-white/5" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="relative hidden h-40 md:block" aria-hidden>
          <VehicleArt kind="cargo" color="orange" className="absolute bottom-2 left-0 w-[38%] drop-shadow-xl" />
          <VehicleArt kind="scooter" color="mint" className="absolute bottom-0 left-[36%] w-[25%] drop-shadow-xl" />
          <VehicleArt kind="car" color="cobalt" className="absolute right-0 bottom-0 w-[42%] drop-shadow-xl" />
        </div>
      </div>
    </section>
  );
}

function NetworkMapCard() {
  const { data, isLoading } = useDealerAnalytics();
  const locations = data?.locations ?? [];
  return (
    <Card className="gap-3">
      <PanelTitle title="Dealer network" href="/dms/dealers" icon={MapPin} />
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : locations.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No active dealers yet.</p>
        ) : (
          <>
            <div className="rounded-xl bg-gradient-to-b from-sky-50/80 to-blue-50/40 p-2 dark:from-slate-900/60 dark:to-slate-900/20">
              <IndiaNetworkMap dealers={locations} className="mx-auto h-[280px]" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <b className="text-foreground">{data?.active}</b> active dealers
              </span>
              <span className="text-muted-foreground">
                <b className="text-foreground">{data?.vehiclesAssigned}</b> vehicles assigned
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentMovements({
  items,
}: {
  items: { id: string; vehicleId: string; vin: string; model: string; stage: VehicleStatus; note: string | null; at: string }[];
}) {
  return (
    <Card className="gap-3">
      <PanelTitle title="Recent vehicle movements" href="/dms/vehicles" />
      <CardContent className="px-3">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No movements yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.slice(0, 6).map((e) => {
              const s = STAGE[e.stage];
              const Icon = s.icon;
              return (
                <li key={e.id}>
                  <Link
                    href={`/dms/vehicles/${e.vehicleId}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/70"
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", s.chip)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs font-bold">{e.vin}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {e.model}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={e.stage} />
                      <span className="text-[10px] text-muted-foreground">{fmtDateTime(e.at)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function rupeesShort(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
}

const MEDAL = [
  "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800",
  "bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950",
];

// Dealers ranked by ₹ delivered — the network's sales scoreboard.
function DealerLeaderboard() {
  const { data, isLoading } = useDealerAnalytics();
  const rows = data?.leaderboard ?? [];
  const best = Math.max(1, ...rows.map((r) => r.deliveredValue));
  return (
    <Card className="h-full gap-3">
      <PanelTitle title="Dealer leaderboard" href="/dms/dealers" icon={Trophy} />
      <CardContent className="px-3">
        {isLoading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No dealers yet.</p>
        ) : (
          <ul className="space-y-1">
            {rows.slice(0, 5).map((r, i) => (
              <li key={r.id}>
                <Link
                  href={`/dms/dealers/${r.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                      MEDAL[i] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-bold">{r.name}</span>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums">
                        {rupeesShort(r.deliveredValue)}
                      </span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.max(4, (r.deliveredValue / best) * 100)}%` }}
                      />
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </span>
                      <span>
                        <b className="text-foreground">{r.delivered}</b> delivered
                      </span>
                      <span>
                        <b className="text-foreground">{r.pipeline}</b> in pipeline
                      </span>
                      {r.openDemand > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          <b>{r.openDemand}</b> awaiting stock
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data && rows.length > 0 && (
          <div className="mx-1 mt-3 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
            {[
              { label: "Network sales", value: rupeesShort(data.deliveredValue), tone: "text-primary" },
              { label: "Units delivered", value: data.delivered, tone: "text-emerald-600 dark:text-emerald-400" },
              { label: "In pipeline", value: data.pipeline, tone: "text-violet-600 dark:text-violet-400" },
              {
                label: "Awaiting stock",
                value: data.openDemand,
                tone: data.openDemand > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground",
              },
            ].map((t) => (
              <div key={t.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">{t.label}</p>
                <p className={cn("text-lg font-extrabold tabular-nums", t.tone)}>{t.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PulseStat({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl border bg-muted/25 p-2.5 transition-colors hover:border-primary/30 hover:bg-muted/50"
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] text-muted-foreground">{label}</span>
        <span className="block text-base leading-tight font-extrabold tabular-nums">{value}</span>
      </span>
    </Link>
  );
}

// Workshop + battery health at a glance.
function WorkshopPulse({ avgSoH }: { avgSoH: number | null }) {
  const jobs = useJobCardAnalytics();
  const appts = useAppointmentAnalytics();
  const j = jobs.data;
  const a = appts.data;
  return (
    <Card className="h-full gap-3">
      <PanelTitle title="Workshop pulse" href="/dms/job-cards" icon={Wrench} />
      <CardContent className="space-y-4">
        {jobs.isError || appts.isError ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Workshop numbers are unavailable right now.
          </p>
        ) : !j || !a ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <PulseStat
              icon={Wrench}
              label="Open jobs"
              value={j.open}
              href="/dms/job-cards"
              tone="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300"
            />
            <PulseStat
              icon={CalendarClock}
              label="Booked visits"
              value={a.booked}
              href="/dms/service-appointments"
              tone="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            />
            <PulseStat
              icon={IndianRupee}
              label="Service revenue"
              value={rupeesShort(j.revenue)}
              href="/dms/job-cards"
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
            />
            <PulseStat
              icon={Timer}
              label="Avg turnaround"
              value={j.avgTurnaroundHours != null ? `${j.avgTurnaroundHours.toFixed(0)}h` : "—"}
              href="/dms/job-cards"
              tone="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300"
            />
          </div>
        )}
        <div className="rounded-xl border bg-muted/25 px-3 pt-3 pb-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <BatteryCharging className="size-3.5 text-emerald-500" />
            Fleet battery health
          </p>
          <RadialGauge value={avgSoH} className="mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function LifecycleTable() {
  const { data, isLoading } = useVehicles({ page: 1, limit: 6, q: "", sort: "createdAt:desc", status: "all" });
  const rows = data?.rows ?? [];
  return (
    <Card className="gap-3">
      <PanelTitle title="Vehicle lifecycle" href="/dms/vehicles" icon={Car} />
      <CardContent className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No vehicles yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5">VIN</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5 text-right">Battery</th>
                <th className="px-4 py-2.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <Link href={`/dms/vehicles/${v.id}`} className="flex items-center gap-3">
                      <VehicleThumb imageUrl={v.imageUrl} model={v.model} color={v.color} className="h-10 w-14" />
                      <span>
                        <span className="block font-semibold">{v.model}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[v.variant, v.color].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{v.vin}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{v.dealer ?? v.warehouse ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {v.batterySoH != null ? (
                      <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                        <BatteryCharging
                          className={cn(
                            "size-4",
                            v.batterySoH >= 80 ? "text-emerald-500" : v.batterySoH >= 60 ? "text-amber-500" : "text-red-500",
                          )}
                        />
                        {v.batterySoH}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{compactMoney(v.sellingRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export function FleetCommand() {
  const qc = useQueryClient();
  const veh = useVehicleAnalytics();
  const d = veh.data;
  const refreshing = qc.isFetching() > 0;

  function refresh() {
    for (const key of ["dashboard", "vehicles", "dealers", "job-cards", "service-appointments"]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  }

  const count = (s: VehicleStatus) =>
    d?.byStage.find((b) => b.name === VEHICLE_STATUS_LABELS[s])?.value ?? 0;

  const tiles: StatItem[] | undefined = d
    ? [
        {
          label: "Total vehicles",
          value: d.total,
          icon: Car,
          color: "blue",
          href: "/dms/vehicles",
          sub: d.avgSoH != null ? `${d.avgSoH.toFixed(0)}% avg battery health` : "Across the network",
        },
        {
          label: "At warehouse",
          value: count("IN_STOCK"),
          icon: Warehouse,
          color: "green",
          href: "/dms/vehicles?status=IN_STOCK",
          sub: pct(count("IN_STOCK"), d.total),
        },
        {
          label: "In transit",
          value: count("ALLOCATED") + count("IN_TRANSIT"),
          icon: Truck,
          color: "orange",
          href: "/dms/vehicles?status=IN_TRANSIT",
          sub: pct(count("ALLOCATED") + count("IN_TRANSIT"), d.total),
        },
        {
          label: "At showroom",
          value: count("AT_DEALER") + count("PDI_DONE"),
          icon: Store,
          color: "violet",
          href: "/dms/vehicles?status=AT_DEALER",
          sub: pct(count("AT_DEALER") + count("PDI_DONE"), d.total),
        },
        {
          label: "Delivered",
          value: d.delivered,
          icon: PackageCheck,
          color: "teal",
          href: "/dms/vehicles?status=DELIVERED",
          sub: `${compactMoney(d.deliveredValue)} sold`,
        },
      ]
    : undefined;

  return (
    <>
      <FleetHero onRefresh={refresh} refreshing={refreshing} />
      <StatCards items={tiles} loading={veh.isLoading} count={5} className="lg:grid-cols-5" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {d ? (
          <CategoryBarChart
            title="Vehicle distribution by status"
            data={d.byStage}
            colors={VEHICLE_STATUSES.map((s) => VEHICLE_STATUS_COLORS[s])}
            emptyMessage="No vehicles yet."
          />
        ) : (
          <Skeleton className="h-[360px] w-full rounded-xl" />
        )}
        <NetworkMapCard />
        {d ? (
          <RecentMovements items={d.recentActivity} />
        ) : (
          <Skeleton className="h-[360px] w-full rounded-xl" />
        )}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DealerLeaderboard />
        </div>
        <WorkshopPulse avgSoH={d?.avgSoH ?? null} />
      </div>
      <div className="mt-6">
        <LifecycleTable />
      </div>
    </>
  );
}
