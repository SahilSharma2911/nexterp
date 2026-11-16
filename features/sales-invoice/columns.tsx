"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import type { SalesInvoiceListItem } from "./schema";

export const columns: ColumnDef<SalesInvoiceListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<SalesInvoiceListItem>("name", "Invoice"),
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
    header: "Customer",
    cell: ({ row }) => row.original.customer,
  },
  {
    accessorKey: "total",
    header: sortableHeader<SalesInvoiceListItem>("total", "Total"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "outstanding",
    header: sortableHeader<SalesInvoiceListItem>("outstanding", "Outstanding"),
    cell: ({ row }) => (
      <span
        className={
          row.original.outstanding > 0
            ? "font-medium tabular-nums text-red-600 dark:text-red-400"
            : "tabular-nums text-muted-foreground"
        }
      >
        {fmtMoney(row.original.outstanding)}
      </span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<SalesInvoiceListItem>("postingAt", "Posted"),
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
