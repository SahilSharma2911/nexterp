"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { VehicleArt } from "@/components/vehicle-art";
import { useRouter } from "next/navigation";
import {
  BatteryCharging,
  Building2,
  Calendar,
  Cpu,
  Gauge,
  ListChecks,
  MapPin,
  Palette,
  Pencil,
  Printer,
  ScanLine,
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
import { useCanWrite } from "@/components/session-context";
import { Barcode } from "@/components/barcode";
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

// Compact inline metric for the header.
function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn("mt-0.5 text-base font-semibold tabular-nums", className)}>
        {value}
      </p>
    </div>
  );
}

// Compact icon-led label/value for the detail cards.
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
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
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
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const subtitle = [v.model, v.variant, v.color].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dms/job-cards?vehicle=${v.id}`}>
            <Wrench className="size-4" />
            Service history
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dms/warranties/vehicle/${v.id}`}>
            <ShieldCheck className="size-4" />
            Warranty
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

      {/* Compact header: image + identity + inline metrics */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border bg-gradient-to-b from-blue-50/70 to-slate-100 sm:h-20 sm:w-32 dark:from-slate-800 dark:to-slate-900">
            {v.imageUrl ? (
              <Image
                src={v.imageUrl}
                alt={v.vin}
                fill
                sizes="(min-width: 640px) 128px, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center px-2">
                <VehicleArt model={v.model} color={v.color} className="max-h-full" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <StatusBadge status={v.status} />
            <h1 className="mt-1.5 truncate font-mono text-xl font-semibold tracking-tight">
              {v.vin}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex gap-6 sm:border-l sm:pl-6">
            <Stat
              label="SoH"
              value={v.batterySoH != null ? `${v.batterySoH}%` : "—"}
              className={
                v.batterySoH != null ? sohClass(v.batterySoH) : undefined
              }
            />
            <Stat label="Selling" value={compactMoney(v.sellingRate)} />
            <Stat
              label="Stage"
              value={
                <span className="text-sm">{VEHICLE_STATUS_LABELS[v.status]}</span>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <VehicleLifecyclePanel vehicleId={v.id} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-4 text-muted-foreground" />
                EV powertrain
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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

          {v.specifications && v.specifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {v.specifications.map((s, i) => (
                  <div key={i} className="min-w-0">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {s.value || dash}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeIndianRupee className="size-4 text-muted-foreground" />
                Commercial
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <Field
                icon={Calendar}
                label="Mfg date"
                value={v.mfgDate ? fmtDateTime(v.mfgDate) : dash}
              />
              {v.remarks && (
                <Field icon={Pencil} label="Remarks" value={v.remarks} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="size-4 text-muted-foreground" />
                Vehicle barcode (VIN)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 py-4">
              <Barcode value={v.vin} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/vehicles/${v.id}/label`}>
                  <Printer className="size-4" />
                  Print tag
                </Link>
              </Button>
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
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {empty ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Nothing yet.</p>
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
            className="flex items-center justify-between px-4 py-2.5"
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
            className="flex items-center justify-between px-4 py-2.5"
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
            className="flex items-center justify-between px-4 py-2.5"
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
