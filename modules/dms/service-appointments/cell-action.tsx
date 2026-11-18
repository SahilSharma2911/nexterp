"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useCancelAppointment,
  useDeleteAppointment,
  useStartAppointment,
} from "./queries";
import type { AppointmentListItem } from "./schema";

export function CellAction({
  appointment,
}: {
  appointment: AppointmentListItem;
}) {
  const router = useRouter();
  const del = useDeleteAppointment();
  const start = useStartAppointment();
  const cancel = useCancelAppointment();
  const [confirm, setConfirm] = useState<null | "delete" | "cancel">(null);
  const canWrite = useCanWrite("dms");

  if (!canWrite) return null;
  const isBooked = appointment.status === "BOOKED";

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {isBooked && (
            <DropdownMenuItem
              onClick={() =>
                start.mutate(appointment.id, {
                  onSuccess: (r) =>
                    router.push(`/dms/job-cards/${r.jobCardId}`),
                })
              }
            >
              <Play className="size-4" />
              Start work
            </DropdownMenuItem>
          )}
          {isBooked && (
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dms/service-appointments/${appointment.id}/edit`)
              }
            >
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
          )}
          {isBooked && (
            <DropdownMenuItem onClick={() => setConfirm("cancel")}>
              <X className="size-4" />
              Cancel appointment
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirm("delete")}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? `Delete ${appointment.name}?`
                : `Cancel ${appointment.name}?`}
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
                  del.mutate(appointment.id, {
                    onSuccess: () => setConfirm(null),
                  });
                } else {
                  cancel.mutate(appointment.id, {
                    onSuccess: () => setConfirm(null),
                  });
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
