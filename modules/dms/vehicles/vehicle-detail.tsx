"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Wrench } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./columns";
import { useDeleteVehicle, useVehicle, useVehicleRelated } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function sohClass(soh: number) {
  if (soh >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (soh >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
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
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={v.vin}
        subtitle={`${v.model}${v.variant ? ` · ${v.variant}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={v.status} />
            <Button asChild variant="outline">
              <Link href={`/dms/job-cards?vehicle=${v.id}`}>
                <Wrench className="size-4" />
                Service history
              </Link>
            </Button>
            {canWrite && (
              <>
                <Button asChild>
                  <Link href={`/dms/job-cards/new?vehicle=${v.id}`}>
                    <Wrench className="size-4" />
                    New Job Card
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dms/vehicles/${v.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {v.imageUrl && (
        <div className="relative h-56 w-full overflow-hidden rounded-lg border bg-muted sm:h-72">
          <Image
            src={v.imageUrl}
            alt={v.vin}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">EV powertrain</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Motor Serial" value={v.motorSerial ?? dash} />
          <Meta label="Battery Serial" value={v.batterySerial ?? dash} />
          <Meta
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
          <Meta label="Color" value={v.color ?? dash} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Commercial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
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
          <Meta
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
          <Meta
            label="Mfg Date"
            value={v.mfgDate ? fmtDateTime(v.mfgDate) : dash}
          />
          <Meta label="Purchase Rate" value={fmtMoney(v.purchaseRate)} />
          <Meta label="Selling Rate" value={fmtMoney(v.sellingRate)} />
          {v.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Remarks" value={v.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleHistory vehicleId={v.id} />

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
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {empty ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">Nothing yet.</p>
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
    <div className="grid gap-6 lg:grid-cols-3">
      <HistoryPanel title="Service history" empty={data.jobCards.length === 0}>
        {data.jobCards.map((j) => (
          <li key={j.id} className="flex items-center justify-between px-6 py-2.5">
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

      <HistoryPanel title="Warranties" empty={data.warranties.length === 0}>
        {data.warranties.map((w) => (
          <li key={w.id} className="flex items-center justify-between px-6 py-2.5">
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

      <HistoryPanel title="Subsidy claims" empty={data.subsidyClaims.length === 0}>
        {data.subsidyClaims.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-6 py-2.5">
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
    </div>
  );
}
