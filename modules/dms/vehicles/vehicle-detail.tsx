"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { useDeleteVehicle, useVehicle } from "./queries";

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
            {canWrite && (
              <>
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
