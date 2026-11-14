"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { fmtMoney, fmtQty } from "@/lib/format";
import type { PurchaseOrderListItem } from "./schema";

export const columns: ColumnDef<PurchaseOrderListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<PurchaseOrderListItem>("name", "Order"),
    cell: ({ row }) => (
      <Link
        href={`/buying/purchase-order/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
  },
  {
    accessorKey: "itemCount",
    header: "Items",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.itemCount}</span>
    ),
  },
  {
    accessorKey: "totalQty",
    header: sortableHeader<PurchaseOrderListItem>("totalQty", "Total Qty"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.totalQty)}</span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: sortableHeader<PurchaseOrderListItem>("totalAmount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.totalAmount)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
];
