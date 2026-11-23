"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { CellAction } from "./cell-action";
import {
  RECALL_STATUS_LABELS,
  SEVERITY_LABELS,
  type RecallListItem,
  type RecallSeverity,
  type RecallStatus,
} from "./schema";

const SEVERITY_STYLE: Record<RecallSeverity, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  HIGH: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  CRITICAL: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function SeverityBadge({ severity }: { severity: RecallSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        SEVERITY_STYLE[severity],
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function RecallStatusBadge({ status }: { status: RecallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        status === "OPEN"
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {RECALL_STATUS_LABELS[status]}
    </span>
  );
}

export const columns: ColumnDef<RecallListItem>[] = [
  {
    accessorKey: "code",
    header: sortableHeader<RecallListItem>("code", "Code"),
    cell: ({ row }) => (
      <Link
        href={`/dms/recalls/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: sortableHeader<RecallListItem>("title", "Title"),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.title}
        {row.original.component ? (
          <span className="ml-2 text-xs text-muted-foreground">
            {row.original.component}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: "models",
    header: "Models",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.models.join(", ") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "severity",
    header: sortableHeader<RecallListItem>("severity", "Severity"),
    cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
  },
  {
    id: "progress",
    header: "Repaired",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {row.original.repaired}/{row.original.affected}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: sortableHeader<RecallListItem>("status", "Status"),
    cell: ({ row }) => <RecallStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction recall={row.original} />,
  },
];
