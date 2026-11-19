"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Battery,
  Calendar,
  Car,
  FileText,
  Gauge,
  Pencil,
  ShieldCheck,
  Timer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DetailHeader, Field } from "@/components/detail/detail-shell";
import { useCanWrite } from "@/components/session-context";
import { COMPONENT_LABELS } from "./schema";
import { useDeleteWarranty, useWarranty } from "./queries";

export function WarrantyDetail({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: w, isLoading } = useWarranty(warrantyId);
  const del = useDeleteWarranty();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !w) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const title = `${w.vehicle} · ${COMPONENT_LABELS[w.component]}`;
  const statusBadge =
    w.status === "VOID" ? (
      <Badge variant="destructive">Void</Badge>
    ) : w.active ? (
      <Badge>Active</Badge>
    ) : (
      <Badge variant="secondary">Expired</Badge>
    );

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={ShieldCheck}
        title={title}
        subtitle={w.vehicleModel}
        badge={statusBadge}
        stats={[
          { label: "Days left", value: w.daysLeft },
          { label: "Claims", value: w.claimCount },
        ]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/warranties/${w.id}/edit`}>
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
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            icon={Car}
            label="Vehicle"
            value={
              <Link
                href={`/dms/vehicles/${w.vehicleId}`}
                className="text-primary hover:underline"
              >
                {w.vehicle}
              </Link>
            }
          />
          <Field
            icon={ShieldCheck}
            label="Component"
            value={COMPONENT_LABELS[w.component]}
          />
          <Field
            icon={Calendar}
            label="Start date"
            value={new Date(w.startDate).toLocaleDateString()}
          />
          <Field icon={Timer} label="Coverage" value={`${w.months} months`} />
          <Field
            icon={Calendar}
            label="Expiry date"
            value={new Date(w.expiryDate).toLocaleDateString()}
          />
          <Field icon={Timer} label="Days left" value={w.daysLeft} />
          <Field
            icon={Gauge}
            label="Km limit"
            value={w.kmLimit != null ? `${w.kmLimit} km` : dash}
          />
          <Field
            icon={Battery}
            label="SoH threshold"
            value={w.soHThreshold != null ? `${w.soHThreshold}%` : dash}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {w.notes ? (
            <p className="text-sm leading-relaxed">{w.notes}</p>
          ) : (
            dash
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the warranty. Warranties with claims
              can&apos;t be deleted — void them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(w.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/warranties");
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
