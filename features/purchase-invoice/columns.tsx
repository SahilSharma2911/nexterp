"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import type { PurchaseInvoiceListItem } from "./schema";

export const columns: ColumnDef<PurchaseInvoiceListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<PurchaseInvoiceListItem>("name", "Invoice"),
    cell: ({ row }) => (
      <Link
        href={`/accounts/purchase-invoice/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier,
  },
  {
    accessorKey: "total",
    header: sortableHeader<PurchaseInvoiceListItem>("total", "Total"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "outstanding",
    header: sortableHeader<PurchaseInvoiceListItem>("outstanding", "Outstanding"),
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
    header: sortableHeader<PurchaseInvoiceListItem>("postingAt", "Posted"),
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
