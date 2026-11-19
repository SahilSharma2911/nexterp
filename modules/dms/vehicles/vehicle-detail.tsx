"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BatteryCharging,
  Building2,
  Calendar,
  Car,
  Cpu,
  Gauge,
  MapPin,
  Palette,
  Pencil,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
  Wrench,
  BadgeIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { VEHICLE_STATUS_LABELS } from "./schema";
import { StatusBadge } from "./columns";
import { useDeleteVehicle, useVehicle, useVehicleRelated } from "./queries";
import { VehicleLifecyclePanel } from "./vehicle-lifecycle-panel";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

function sohClass(soh: number) {
  if (soh >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (soh >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function VehicleDetail({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: v, isLoading } = useVehicle(vehicleId);
  const del = useDeleteVehicle();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !v) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const margin = v.sellingRate - v.purchaseRate;
  const subtitle = [v.model, v.variant, v.color].filter(Boolean).join(" · ");

  const metrics: StatItem[] = [
    {
      label: "Battery health",
      value: v.batterySoH != null ? `${v.batterySoH}%` : "—",
      icon: BatteryCharging,
      tone:
        v.batterySoH == null
          ? "default"
          : v.batterySoH >= 80
            ? "positive"
            : v.batterySoH >= 60
              ? "warning"
              : "negative",
      sub: "State of Health",
    },
    {
      label: "Selling price",
      value: compactMoney(v.sellingRate),
      icon: Wallet,
      sub: "listed",
    },
    {
      label: "Est. margin",
      value: compactMoney(margin),
      icon: TrendingUp,
      tone: margin > 0 ? "positive" : "default",
      sub: "selling − cost",
    },
    {
      label: "Stage",
      value: VEHICLE_STATUS_LABELS[v.status],
      icon: Gauge,
      sub: "lifecycle",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dms/job-cards?vehicle=${v.id}`}>
            <Wrench className="size-4" />
            Service history
          </Link>
        </Button>
        {canWrite && (
          <>
            <Button asChild size="sm">
              <Link href={`/dms/job-cards/new?vehicle=${v.id}`}>
                <Wrench className="size-4" />
                New Job Card
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dms/vehicles/${v.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Hero */}
      <section className="relative h-64 overflow-hidden rounded-2xl ring-1 ring-foreground/10 sm:h-80">
        {v.imageUrl ? (
          <Image
            src={v.imageUrl}
            alt={v.vin}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/50">
            <Car className="absolute -right-6 -bottom-8 size-64 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
          <StatusBadge status={v.status} />
          <div>
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              {v.vin}
            </h1>
            <p className="mt-1 text-sm text-white/85">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {v.batterySoH != null && (
              <Chip icon={BatteryCharging} text={`${v.batterySoH}% SoH`} />
            )}
            <Chip icon={Wallet} text={compactMoney(v.sellingRate)} />
            {v.dealer && <Chip icon={Building2} text={v.dealer} />}
          </div>
        </div>
      </section>

      {/* Key metrics */}
      <StatCards items={metrics} />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VehicleLifecyclePanel vehicleId={v.id} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-4 text-muted-foreground" />
                EV powertrain
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field icon={Cpu} label="Motor serial" value={v.motorSerial ?? dash} />
              <Field
                icon={BatteryCharging}
                label="Battery serial"
                value={v.batterySerial ?? dash}
              />
              <Field
                icon={Gauge}
                label="Battery SoH"
                value={
                  v.batterySoH == null ? (
                    dash
                  ) : (
                    <span className={cn(sohClass(v.batterySoH))}>
                      {v.batterySoH}%
                    </span>
                  )
                }
              />
              <Field icon={Palette} label="Colour" value={v.color ?? dash} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeIndianRupee className="size-4 text-muted-foreground" />
                Commercial
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Field
                icon={MapPin}
                label="Location"
                value={
                  v.warehouseId && v.warehouse ? (
                    <Link
                      href={`/stock/warehouses/${v.warehouseId}`}
                      className="text-primary hover:underline"
                    >
                      {v.warehouse}
                    </Link>
                  ) : (
                    dash
                  )
                }
              />
              <Field
                icon={Building2}
                label="Dealer"
                value={
                  v.dealerId && v.dealer ? (
                    <Link
                      href={`/dms/dealers/${v.dealerId}`}
                      className="text-primary hover:underline"
                    >
                      {v.dealer}
                    </Link>
                  ) : (
                    dash
                  )
                }
              />
              <Field
                icon={Calendar}
                label="Mfg date"
                value={v.mfgDate ? fmtDateTime(v.mfgDate) : dash}
              />
              <div className="grid grid-cols-2 gap-5">
                <Field
                  icon={Wallet}
                  label="Purchase"
                  value={fmtMoney(v.purchaseRate)}
                />
                <Field
                  icon={TrendingUp}
                  label="Selling"
                  value={fmtMoney(v.sellingRate)}
                />
              </div>
              {v.remarks && (
                <Field icon={Pencil} label="Remarks" value={v.remarks} />
              )}
            </CardContent>
          </Card>

          <VehicleHistory vehicleId={v.id} />
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {v.vin}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the vehicle record. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(v.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/vehicles");
                  },
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Chip({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <Icon className="size-3.5" />
      {text}
    </span>
  );
}

function HistoryPanel({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: React.ElementType;
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {empty ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y text-sm">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleHistory({ vehicleId }: { vehicleId: string }) {
  const { data } = useVehicleRelated(vehicleId);
  if (!data) return null;

  return (
    <>
      <HistoryPanel
        icon={Wrench}
        title="Service history"
        empty={data.jobCards.length === 0}
      >
        {data.jobCards.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between px-5 py-2.5"
          >
            <Link
              href={`/dms/job-cards/${j.id}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {j.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {j.status} · {fmtMoney(j.total)}
            </span>
          </li>
        ))}
      </HistoryPanel>

      <HistoryPanel
        icon={ShieldCheck}
        title="Warranties"
        empty={data.warranties.length === 0}
      >
        {data.warranties.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between px-5 py-2.5"
          >
            <Link
              href={`/dms/warranties/${w.id}`}
              className="text-xs text-primary hover:underline"
            >
              {w.component}
            </Link>
            <span className="text-xs text-muted-foreground">
              {w.active ? "Active" : w.status === "VOID" ? "Void" : "Expired"} ·{" "}
              {fmtDateTime(w.expiryDate)}
            </span>
          </li>
        ))}
      </HistoryPanel>

      <HistoryPanel
        icon={BadgeIndianRupee}
        title="Subsidy claims"
        empty={data.subsidyClaims.length === 0}
      >
        {data.subsidyClaims.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between px-5 py-2.5"
          >
            <Link
              href={`/dms/subsidy-claims/${s.id}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {s.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {s.status} · {fmtMoney(s.claimAmount)}
            </span>
          </li>
        ))}
      </HistoryPanel>
    </>
  );
}
