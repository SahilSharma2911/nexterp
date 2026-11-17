"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { useCanWrite } from "@/components/session-context";
import { COMPONENT_LABELS } from "./schema";
import { useDeleteWarranty, useWarranty } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function WarrantyDetail({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: w, isLoading } = useWarranty(warrantyId);
  const del = useDeleteWarranty();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !w) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
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
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={w.vehicleModel}
        actions={
          <div className="flex items-center gap-2">
            {statusBadge}
            {canWrite && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/warranties/${w.id}/edit`}>
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
          <CardTitle className="text-sm">Coverage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
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
          <Meta label="Component" value={COMPONENT_LABELS[w.component]} />
          <Meta
            label="Start date"
            value={new Date(w.startDate).toLocaleDateString()}
          />
          <Meta label="Coverage" value={`${w.months} months`} />
          <Meta
            label="Expiry date"
            value={new Date(w.expiryDate).toLocaleDateString()}
          />
          <Meta
            label="Days left"
            value={<span className="tabular-nums">{w.daysLeft}</span>}
          />
          <Meta
            label="Km limit"
            value={w.kmLimit != null ? `${w.kmLimit} km` : dash}
          />
          <Meta
            label="Battery SoH threshold"
            value={w.soHThreshold != null ? `${w.soHThreshold}%` : dash}
          />
          <Meta
            label="Claims"
            value={<span className="tabular-nums">{w.claimCount}</span>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes</CardTitle>
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
