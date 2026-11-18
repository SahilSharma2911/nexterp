"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentListItem,
  type AppointmentStatus,
} from "./schema";
import { CellAction } from "./cell-action";

const statusStyle: Record<AppointmentStatus, string> = {
  BOOKED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  CONVERTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyle[status],
      )}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}

export const columns: ColumnDef<AppointmentListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<AppointmentListItem>("name", "Appointment"),
    cell: ({ row }) => (
      <Link
        href={`/dms/service-appointments/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => (
      <span>
        <span className="font-mono text-xs">{row.original.vehicle}</span>
        <span className="ml-2 text-muted-foreground">
          {row.original.vehicleModel}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "requestedAt",
    header: sortableHeader<AppointmentListItem>("requestedAt", "Requested"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {fmtDateTime(row.original.requestedAt)}
      </span>
    ),
  },
  {
    id: "assignment",
    header: "Bay / Technician",
    cell: ({ row }) => {
      const parts = [row.original.bay, row.original.technician].filter(Boolean);
      return (
        <span className="flex items-center gap-1.5 text-sm">
          {parts.length ? (
            parts.join(" · ")
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
          {row.original.isHV && (
            <span className="inline-flex rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              HV
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <AppointmentStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction appointment={row.original} />,
  },
];
