"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export type SalesInvoiceRow = {
  id: string;
  name: string;
  customer: string;
  status: string;
  total: number;
  outstanding: number;
  postingAt: string;
};

export const columns: ColumnDef<SalesInvoiceRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Invoice" />,
    cell: ({ row }) => (
      <Link
        href={`/accounts/sales-invoice/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <SortHeader column={column} label="Customer" />,
  },
  {
    accessorKey: "total",
    header: ({ column }) => <SortHeader column={column} label="Total" />,
    cell: ({ row }) => <span className="tabular-nums">{fmtMoney(row.original.total)}</span>,
  },
  {
    accessorKey: "outstanding",
    header: ({ column }) => <SortHeader column={column} label="Outstanding" />,
    cell: ({ row }) => (
      <span
        className={
          row.original.outstanding > 0
            ? "tabular-nums text-red-600 dark:text-red-400"
            : "tabular-nums text-muted-foreground"
        }
      >
        {fmtMoney(row.original.outstanding)}
      </span>
    ),
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

export function SalesInvoicesTable({ data }: { data: SalesInvoiceRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search invoice or customer…"
      emptyMessage="No sales invoices yet."
    />
  );
}
