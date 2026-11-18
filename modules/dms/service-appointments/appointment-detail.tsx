"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { fmtDateTime } from "@/lib/format";
import { AppointmentStatusBadge } from "./columns";
import {
  useAppointment,
  useCancelAppointment,
  useDeleteAppointment,
  useStartAppointment,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function AppointmentDetail({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: a, isLoading } = useAppointment(appointmentId);
  const start = useStartAppointment();
  const cancel = useCancelAppointment();
  const del = useDeleteAppointment();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !a) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const isBooked = a.status === "BOOKED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={a.name}
        subtitle={`${a.vehicle} · ${a.vehicleModel}`}
        actions={
          <div className="flex items-center gap-2">
            {a.isHV && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV
              </Badge>
            )}
            <AppointmentStatusBadge status={a.status} />
            {canWrite && isBooked && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/service-appointments/${a.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirm("cancel")}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button
                  disabled={start.isPending}
                  onClick={() =>
                    start.mutate(a.id, {
                      onSuccess: (r) =>
                        router.push(`/dms/job-cards/${r.jobCardId}`),
                    })
                  }
                >
                  <Play className="size-4" />
                  {start.isPending ? "Starting…" : "Start work"}
                </Button>
              </>
            )}
            {canWrite && !isBooked && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirm("delete")}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta
            label="Vehicle"
            value={
              <Link
                href={`/dms/vehicles/${a.vehicleId}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {a.vehicle}
              </Link>
            }
          />
          <Meta label="Customer" value={a.customerName ?? dash} />
          <Meta label="Requested" value={fmtDateTime(a.requestedAt)} />
          <Meta label="Technician" value={a.technician ?? dash} />
          <Meta label="Service Bay" value={a.bay ?? dash} />
          <Meta label="Work type" value={a.isHV ? "High-voltage" : "Standard"} />
          {a.jobCardId && a.jobCardName && (
            <Meta
              label="Job card"
              value={
                <Link
                  href={`/dms/job-cards/${a.jobCardId}`}
                  className="text-primary hover:underline"
                >
                  {a.jobCardName}
                </Link>
              }
            />
          )}
          {a.complaint && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Meta label="Complaint" value={a.complaint} />
            </div>
          )}
          {a.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Meta label="Remarks" value={a.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? `Delete ${a.name}?`
                : `Cancel ${a.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently removes the appointment."
                : "This marks the appointment as cancelled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "delete") {
                  del.mutate(a.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/dms/service-appointments");
                    },
                  });
                } else {
                  cancel.mutate(a.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
