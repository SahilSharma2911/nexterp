"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtQty, fmtDateTime } from "@/lib/format";
import type { PurchaseReceiptListItem } from "./schema";

export const columns: ColumnDef<PurchaseReceiptListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<PurchaseReceiptListItem>("name", "Receipt"),
    cell: ({ row }) => (
      <Link
        href={`/buying/purchase-receipt/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "supplier", header: "Supplier" },
  { accessorKey: "warehouse", header: "Warehouse" },
  {
    accessorKey: "totalQty",
    header: sortableHeader<PurchaseReceiptListItem>("totalQty", "Qty"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.totalQty)}</span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: sortableHeader<PurchaseReceiptListItem>("totalAmount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.totalAmount)}</span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<PurchaseReceiptListItem>("postingAt", "Posted"),
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
