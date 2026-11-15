"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtDateTime } from "@/lib/format";

export type ReconRow = {
  id: string;
  name: string;
  status: string;
  postingAt: string;
  itemCount: number;
};

export const columns: ColumnDef<ReconRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Entry" />,
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
    header: "Items",
    cell: ({ row }) => <span className="tabular-nums">{row.original.itemCount}</span>,
  },
  {
    accessorKey: "postingAt",
    header: ({ column }) => <SortHeader column={column} label="Posted" />,
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

export function ReconciliationTable({ data }: { data: ReconRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search by entry no…"
      emptyMessage="No reconciliations yet."
    />
  );
}
