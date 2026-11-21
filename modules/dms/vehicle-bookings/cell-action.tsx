"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { useDeleteBooking } from "./queries";
import type { BookingListItem } from "./schema";

export function CellAction({ booking }: { booking: BookingListItem }) {
  const router = useRouter();
  const del = useDeleteBooking();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canWrite = useCanWrite("dms");

  if (!canWrite) return null;
  const editable = booking.status === "BOOKED";

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
          <DropdownMenuItem
            onClick={() => router.push(`/dms/vehicle-bookings/${booking.id}`)}
          >
            Open
          </DropdownMenuItem>
          {editable && (
            <>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dms/vehicle-bookings/${booking.id}/edit`)
                }
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {booking.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the booking. Allotted or delivered bookings can&apos;t
              be deleted — cancel them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(booking.id, {
                  onSuccess: () => setConfirmOpen(false),
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
