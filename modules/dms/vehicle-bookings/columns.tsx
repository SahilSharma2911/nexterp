"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { CellAction } from "./cell-action";
import {
  BOOKING_STATUS_LABELS,
  PRIORITY_LABELS,
  type BookingListItem,
  type BookingStatus,
} from "./schema";

const STATUS_STYLE: Record<BookingStatus, string> = {
  BOOKED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  ALLOTTED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

export const columns: ColumnDef<BookingListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<BookingListItem>("name", "Booking"),
    cell: ({ row }) => (
      <Link
        href={`/dms/vehicle-bookings/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: sortableHeader<BookingListItem>("customerName", "Customer"),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.customerName}
        {row.original.phone ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {row.original.phone}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: "model",
    header: "Model",
    cell: ({ row }) => (
      <span className="text-sm">
        {[row.original.model, row.original.variant, row.original.color]
          .filter(Boolean)
          .join(" · ")}
      </span>
    ),
  },
  {
    id: "queue",
    header: "Queue",
    cell: ({ row }) =>
      row.original.queuePosition != null ? (
        <span className="tabular-nums font-medium">
          #{row.original.queuePosition}
        </span>
      ) : row.original.vin ? (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.vin}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "priority",
    header: sortableHeader<BookingListItem>("priority", "Priority"),
    cell: ({ row }) =>
      row.original.priority === 1 ? (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">
          {PRIORITY_LABELS[1]}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          {PRIORITY_LABELS[row.original.priority] ?? "Normal"}
        </span>
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction booking={row.original} />,
  },
];
