"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  Car,
  CheckCircle2,
  Clock,
  IndianRupee,
  ListOrdered,
  Palette,
  Pencil,
  Phone,
  Store,
  Tag,
  Truck,
  UserRound,
  Zap,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailHeader, Field } from "@/components/detail/detail-shell";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { BookingStatusBadge } from "./columns";
import { PRIORITY_LABELS, type AvailableVehicle } from "./schema";
import {
  useBooking,
  useAvailableVehicles,
  useAllotBooking,
  useAllotNextVehicle,
  useDeliverBooking,
  useCancelBooking,
} from "./queries";

const dash = <span className="text-muted-foreground">—</span>;

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: b, isLoading } = useBooking(bookingId);

  const allot = useAllotBooking();
  const allotNext = useAllotNextVehicle();
  const deliver = useDeliverBooking();
  const cancel = useCancelBooking();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading || !b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const modelLine = [b.model, b.variant, b.color].filter(Boolean).join(" · ");
  const busy =
    allot.isPending ||
    allotNext.isPending ||
    deliver.isPending ||
    cancel.isPending;

  const actions = canWrite ? (
    <>
      {b.status === "BOOKED" && (
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/dms/vehicle-bookings/${b.id}/edit`)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => allotNext.mutate(b.id)}
          >
            <Zap className="size-4" />
            Auto-allot next
          </Button>
          <Button disabled={busy} onClick={() => setPickerOpen(true)}>
            <Car className="size-4" />
            Allot a vehicle
          </Button>
        </>
      )}
      {b.status === "ALLOTTED" && (
        <Button disabled={busy} onClick={() => deliver.mutate(b.id)}>
          <Truck className="size-4" />
          Mark delivered
        </Button>
      )}
      {(b.status === "BOOKED" || b.status === "ALLOTTED") && (
        <Button
          variant="outline"
          className="text-destructive"
          disabled={busy}
          onClick={() => setCancelOpen(true)}
        >
          <Ban className="size-4" />
          Cancel
        </Button>
      )}
    </>
  ) : null;

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Car}
        titleMono
        title={b.name}
        badge={<BookingStatusBadge status={b.status} />}
        subtitle={
          <>
            {b.customerName}
            {b.phone ? ` · ${b.phone}` : ""} — {modelLine}
          </>
        }
        stats={[
          {
            label: "Queue",
            value:
              b.queuePosition != null ? (
                `#${b.queuePosition}`
              ) : b.status === "BOOKED" ? (
                "—"
              ) : (
                BookingStatusLabelInline(b.status)
              ),
          },
          { label: "Advance", value: fmtMoney(b.advance) },
        ]}
        actions={actions}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Customer + vehicle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Booking details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field icon={UserRound} label="Customer" value={b.customerName} />
            <Field
              icon={Phone}
              label="Phone"
              value={b.phone ?? dash}
            />
            <Field
              icon={Store}
              label="Dealer"
              value={b.dealerName ?? dash}
            />
            <Field icon={Tag} label="Model" value={b.model} />
            <Field
              icon={Tag}
              label="Variant"
              value={b.variant ?? dash}
            />
            <Field
              icon={Palette}
              label="Colour"
              value={b.color ?? dash}
            />
            <Field
              icon={ListOrdered}
              label="Priority"
              value={PRIORITY_LABELS[b.priority] ?? "Normal"}
            />
            <Field
              icon={IndianRupee}
              label="Advance / token"
              value={fmtMoney(b.advance)}
            />
            <Field
              icon={Car}
              label="Vehicle (VIN)"
              value={
                b.vehicleId && b.vin ? (
                  <Link
                    href={`/dms/vehicles/${b.vehicleId}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {b.vin}
                  </Link>
                ) : (
                  dash
                )
              }
            />
            {b.note && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Note
                </p>
                <p className="mt-0.5 text-sm">{b.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <TimelineStep
                icon={Clock}
                done
                label="Booked"
                at={b.createdAt}
              />
              <TimelineStep
                icon={Car}
                done={!!b.allottedAt}
                label="Allotted"
                at={b.allottedAt}
              />
              <TimelineStep
                icon={CheckCircle2}
                done={!!b.deliveredAt}
                label="Delivered"
                at={b.deliveredAt}
              />
              {b.cancelledAt && (
                <TimelineStep
                  icon={Ban}
                  done
                  tone="destructive"
                  label="Cancelled"
                  at={b.cancelledAt}
                />
              )}
            </ol>
          </CardContent>
        </Card>
      </div>

      <VehiclePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        bookingId={b.id}
        model={modelLine}
        pending={allot.isPending}
        onPick={(vehicleId) =>
          allot.mutate(
            { id: b.id, vehicleId },
            { onSuccess: () => setPickerOpen(false) },
          )
        }
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {b.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The booking is marked cancelled.
              {b.status === "ALLOTTED"
                ? " The allotted vehicle is released back to the available pool."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={(e) => {
                e.preventDefault();
                cancel.mutate(b.id, { onSuccess: () => setCancelOpen(false) });
              }}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingStatusLabelInline(status: string) {
  return status === "ALLOTTED"
    ? "Allotted"
    : status === "DELIVERED"
      ? "Delivered"
      : "—";
}

function TimelineStep({
  icon: Icon,
  label,
  at,
  done,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  at: string | null;
  done?: boolean;
  tone?: "destructive";
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border",
          done
            ? tone === "destructive"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            !done && "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {at ? fmtDateTime(at) : "Pending"}
        </p>
      </div>
    </li>
  );
}

function VehiclePickerDialog({
  open,
  onOpenChange,
  bookingId,
  model,
  onPick,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  model: string;
  onPick: (vehicleId: string) => void;
  pending: boolean;
}) {
  const { data: vehicles = [], isLoading } = useAvailableVehicles(
    open ? bookingId : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Allot a vehicle</DialogTitle>
          <DialogDescription>
            Ready stock matching <span className="font-medium">{model}</span> and
            not already on another booking.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : vehicles.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matching vehicle is ready to hand over yet.
          </p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {vehicles.map((v: AvailableVehicle) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-medium">{v.vin}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[v.model, v.variant, v.color].filter(Boolean).join(" · ")}
                    {" · "}
                    {v.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => onPick(v.id)}
                >
                  Allot
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
