"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtQty, fmtDateTime } from "@/lib/format";
import type { DeliveryNoteListItem } from "./schema";

export const columns: ColumnDef<DeliveryNoteListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<DeliveryNoteListItem>("name", "Note"),
    cell: ({ row }) => (
      <Link
        href={`/selling/delivery-note/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "warehouse", header: "Warehouse" },
  {
    accessorKey: "totalQty",
    header: sortableHeader<DeliveryNoteListItem>("totalQty", "Qty"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.totalQty)}</span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: sortableHeader<DeliveryNoteListItem>("totalAmount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.totalAmount)}</span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<DeliveryNoteListItem>("postingAt", "Posted"),
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
