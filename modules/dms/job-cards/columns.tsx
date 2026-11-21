"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import {
  JOB_STATUS_LABELS,
  type JobCardListItem,
  type JobStatus,
} from "./schema";

const statusStyle: Record<JobStatus, string> = {
  ESTIMATE: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  OPEN: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyle[status],
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export const columns: ColumnDef<JobCardListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<JobCardListItem>("name", "Job"),
    cell: ({ row }) => (
      <Link
        href={`/dms/job-cards/${row.original.id}`}
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
    id: "technician",
    header: "Technician",
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-sm">
        {row.original.technician ?? (
          <span className="text-muted-foreground">—</span>
        )}
        {row.original.isHV && (
          <span className="inline-flex rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            HV
          </span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "serviceDate",
    header: sortableHeader<JobCardListItem>("serviceDate", "Service Date"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {fmtDateTime(row.original.serviceDate)}
      </span>
    ),
  },
  {
    accessorKey: "total",
    header: sortableHeader<JobCardListItem>("total", "Total"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
  },
];
