"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Zap,
  CalendarDays,
  Gauge,
  CalendarClock,
  Clock,
  Car,
  UserRound,
} from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge } from "@/modules/dms/service-appointments/columns";
import type {
  BayUtilization,
  ScheduleAppointment,
  TechAvailability,
} from "./schema";
import { useServiceBayDashboard } from "./queries";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ServiceBaysDashboard() {
  const { data, isLoading } = useServiceBayDashboard();

  const items: StatItem[] | undefined = data && [
    {
      label: "Service bays",
      value: data.bays,
      icon: LayoutGrid,
      sub: `${data.activeBays} active`,
    },
    {
      label: "HV equipped",
      value: data.hvBays,
      icon: Zap,
      tone: "positive",
      sub: "cleared for high-voltage",
    },
    {
      label: "Today's bookings",
      value: data.todayCount,
      icon: CalendarDays,
      tone: data.todayCount > 0 ? "warning" : undefined,
      sub: `${data.upcomingCount} upcoming`,
    },
    {
      label: "Bay utilization",
      value: `${data.utilization}%`,
      icon: Gauge,
      sub: "active bays in use today",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-3">
        <DaySchedule
          className="lg:col-span-2"
          loading={isLoading}
          data={data?.today}
        />
        <TechnicianAvailability loading={isLoading} data={data?.technicians} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <BayUtilizationCard loading={isLoading} data={data?.bayUtilization} />
        <UpcomingAppointments loading={isLoading} data={data?.upcoming} />
      </div>
    </div>
  );
}

function DaySchedule({
  loading,
  data,
  className,
}: {
  loading?: boolean;
  data?: ScheduleAppointment[];
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          Today&apos;s schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No bookings scheduled for today.
          </p>
        ) : (
          <ol className="space-y-3">
            {data.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="flex w-16 shrink-0 flex-col items-end pt-0.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {fmtTime(a.requestedAt)}
                  </span>
                </div>
                <div className="relative flex-1 border-l pl-4">
                  <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-primary bg-background" />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/dms/service-appointments/${a.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {a.name}
                    </Link>
                    {a.isHV && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        HV
                      </Badge>
                    )}
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 text-sm">
                    <Link
                      href={`/dms/vehicles/${a.vehicleId}`}
                      className="text-primary hover:underline"
                    >
                      {a.vin}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      · {a.model}
                      {a.customerName ? ` · ${a.customerName}` : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="size-3" />
                      {a.bayName ?? "Unassigned bay"}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserRound className="size-3" />
                      {a.technicianName ?? "Unassigned"}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function TechnicianAvailability({
  loading,
  data,
}: {
  loading?: boolean;
  data?: TechAvailability[];
}) {
  const free = data?.filter((t) => !t.busy).length ?? 0;
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            Technician availability
          </span>
          {data && data.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {free} free
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No technicians.</p>
        ) : (
          <ul className="divide-y">
            {data.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 px-4 py-2.5 text-sm"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    t.busy ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
                <Link
                  href={`/dms/technicians/${t.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {t.name}
                </Link>
                {t.isHVCertified && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    HV
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {t.busy
                    ? `${t.openJobs} open · ${t.todayAppointments} today`
                    : "Available"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BayUtilizationCard({
  loading,
  data,
}: {
  loading?: boolean;
  data?: BayUtilization[];
}) {
  const max = Math.max(1, ...(data?.map((b) => b.todayBookings + b.openJobs) ?? [0]));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="size-4 text-muted-foreground" />
          Service bay utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No service bays.</p>
        ) : (
          <ul className="divide-y">
            {data.map((b) => {
              const load = b.todayBookings + b.openJobs;
              return (
                <li key={b.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/dms/service-bays/${b.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {b.name}
                    </Link>
                    {b.isHV && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        HV
                      </Badge>
                    )}
                    {!b.active && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {b.todayBookings} today · {b.openJobs} open
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        load === 0 ? "bg-transparent" : "bg-primary",
                      )}
                      style={{ width: `${(load / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingAppointments({
  loading,
  data,
}: {
  loading?: boolean;
  data?: ScheduleAppointment[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" />
          Upcoming appointments
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No upcoming appointments.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  {fmtDay(a.requestedAt)}, {fmtTime(a.requestedAt)}
                </span>
                <Link
                  href={`/dms/service-appointments/${a.id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {a.name}
                </Link>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Car className="size-3" />
                  {a.vin}
                </span>
                {a.isHV && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    HV
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.bayName ?? "No bay"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
