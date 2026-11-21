"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Car,
  HardHat,
  MessageSquare,
  Pencil,
  Play,
  Trash2,
  User,
  Wrench,
  X,
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
import {
  AssignResourcesDialog,
  AssignNotice,
} from "@/components/dms/assign-resources-dialog";
import { useCanWrite } from "@/components/session-context";
import { fmtDateTime } from "@/lib/format";
import { AppointmentStatusBadge } from "./columns";
import {
  useAppointment,
  useAssignAppointment,
  useCancelAppointment,
  useDeleteAppointment,
  useStartAppointment,
} from "./queries";

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
  const assign = useAssignAppointment();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading || !a) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const isBooked = a.status === "BOOKED";
  const unassigned = isBooked && (!a.bayId || !a.technicianId);
  const missing = !a.bayId && !a.technicianId
    ? "No technician or service bay assigned yet."
    : !a.technicianId
      ? "No technician assigned yet."
      : "No service bay assigned yet.";

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={CalendarClock}
        title={a.name}
        titleMono
        subtitle={`${a.vehicle} · ${a.vehicleModel}`}
        badge={
          <div className="flex items-center gap-2">
            {a.isHV && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV
              </Badge>
            )}
            <AppointmentStatusBadge status={a.status} />
          </div>
        }
        stats={[{ label: "Requested", value: fmtDateTime(a.requestedAt) }]}
        actions={
          <>
            {canWrite && isBooked && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignOpen(true)}
                >
                  <HardHat className="size-4" />
                  Assign
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dms/service-appointments/${a.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm("cancel")}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
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
                size="sm"
                className="text-destructive"
                onClick={() => setConfirm("delete")}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
        }
      />

      {unassigned && (
        <AssignNotice
          label={missing}
          onAssign={() => setAssignOpen(true)}
          disabled={!canWrite}
        />
      )}

      {assignOpen && (
        <AssignResourcesDialog
          isHV={a.isHV}
          bayId={a.bayId}
          technicianId={a.technicianId}
          saving={assign.isPending}
          onOpenChange={setAssignOpen}
          onSave={(vals) =>
            assign.mutate(
              { id: a.id, ...vals },
              { onSuccess: () => setAssignOpen(false) },
            )
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={Car}
              label="Vehicle"
              value={
                <Link
                  href={`/dms/vehicles/${a.vehicleId}`}
                  className="font-mono text-primary hover:underline"
                >
                  {a.vehicle}
                </Link>
              }
            />
            <Field icon={User} label="Customer" value={a.customerName ?? dash} />
            <Field icon={HardHat} label="Technician" value={a.technician ?? dash} />
            <Field icon={Building2} label="Service bay" value={a.bay ?? dash} />
            <Field
              icon={Wrench}
              label="Work type"
              value={a.isHV ? "High-voltage" : "Standard"}
            />
            {a.jobCardId && a.jobCardName && (
              <Field
                icon={Wrench}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field
              icon={MessageSquare}
              label="Complaint"
              value={a.complaint ?? dash}
            />
            <Field icon={Pencil} label="Remarks" value={a.remarks ?? dash} />
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete" ? `Delete ${a.name}?` : `Cancel ${a.name}?`}
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
