"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Pencil,
  Trash2,
  UserRound,
  Wrench,
  Zap,
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
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { JobStatusBadge } from "@/modules/dms/job-cards/columns";
import type { BayJobRow, ScheduleAppointment } from "./schema";
import { useServiceBayDetail, useDeleteServiceBay } from "./queries";

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const dash = <span className="text-muted-foreground">—</span>;

export function ServiceBayDetail({ bayId }: { bayId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: b, isLoading } = useServiceBayDetail(bayId);
  const del = useDeleteServiceBay();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const stats: StatItem[] = [
    {
      label: "Total jobs",
      value: b.totalJobs,
      icon: Wrench,
      sub: `${b.appointments} appointments`,
    },
    {
      label: "Open jobs",
      value: b.openJobs,
      icon: Wrench,
      tone: b.openJobs > 0 ? "warning" : undefined,
    },
    {
      label: "Completed",
      value: b.completedJobs,
      icon: CheckCircle2,
      tone: "positive",
    },
    {
      label: "Today's bookings",
      value: b.todayBookings,
      icon: CalendarDays,
      tone: b.todayBookings > 0 ? "warning" : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={LayoutGrid}
        title={b.name}
        subtitle="Service bay"
        badge={
          <div className="flex items-center gap-2">
            {b.isHV && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV bay
              </Badge>
            )}
            {b.active ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        }
        stats={[{ label: "Job cards", value: b.totalJobs }]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/service-bays/${b.id}/edit`}>
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

      <StatCards items={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Overview */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-muted-foreground" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={Zap}
              label="Type"
              value={b.isHV ? "HV bay" : "Standard"}
            />
            <Field
              icon={LayoutGrid}
              label="Status"
              value={b.active ? "Active" : "Inactive"}
            />
            <Field
              icon={CalendarDays}
              label="Commissioned"
              value={fmtDateTime(b.createdAt)}
            />
            <Field
              icon={Clock}
              label="Today's bookings"
              value={b.todayBookings}
            />
          </CardContent>
        </Card>

        {/* Upcoming appointments for this bay */}
        <UpcomingForBay className="lg:col-span-2" rows={b.upcoming} />

        {/* Recent job cards */}
        <RecentBayJobs className="lg:col-span-3" rows={b.recentJobs} />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {b.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Bays referenced by job cards or appointments can&apos;t be deleted
              — mark them inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(b.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/service-bays");
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

function UpcomingForBay({
  rows,
  className,
}: {
  rows: ScheduleAppointment[];
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" />
          Upcoming appointments
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No upcoming appointments for this bay.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  {fmtWhen(a.requestedAt)}
                </span>
                <Link
                  href={`/dms/service-appointments/${a.id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {a.name}
                </Link>
                <Link
                  href={`/dms/vehicles/${a.vehicleId}`}
                  className="text-primary hover:underline"
                >
                  {a.vin}
                </Link>
                <span className="text-muted-foreground">· {a.model}</span>
                {a.isHV && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    HV
                  </Badge>
                )}
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <UserRound className="size-3" />
                  {a.technicianName ?? "Unassigned"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentBayJobs({
  rows,
  className,
}: {
  rows: BayJobRow[];
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="size-4 text-muted-foreground" />
          Recent job cards
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No job cards in this bay yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Job</th>
                <th className="p-3 font-medium">Vehicle</th>
                <th className="p-3 font-medium">Technician</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-right font-medium">Service date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/dms/job-cards/${j.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {j.name}
                    </Link>
                    {j.isHV && (
                      <Badge className="ml-2 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        HV
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dms/vehicles/${j.vehicleId}`}
                      className="text-primary hover:underline"
                    >
                      {j.vin}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      {j.model}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {j.technicianName ?? dash}
                  </td>
                  <td className="p-3">
                    <JobStatusBadge status={j.status} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(j.total)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground tabular-nums">
                    {fmtDateTime(j.serviceDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
