"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtDateTime } from "@/lib/format";
import type { ReconciliationListItem } from "./schema";

export const columns: ColumnDef<ReconciliationListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<ReconciliationListItem>("name", "Entry"),
    cell: ({ row }) => (
      <Link
        href={`/stock/reconciliation/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Rows",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.itemCount}</span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<ReconciliationListItem>("postingAt", "Posted"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {fmtDateTime(row.original.postingAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <DocStatusBadge status={row.original.status} />,
  },
];
