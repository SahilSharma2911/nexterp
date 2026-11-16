"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import type { PaymentEntryListItem } from "./schema";

export const columns: ColumnDef<PaymentEntryListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<PaymentEntryListItem>("name", "Payment"),
    cell: ({ row }) => (
      <Link
        href={`/accounts/payment-entry/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "paymentType",
    header: "Type",
    cell: ({ row }) =>
      row.original.paymentType === "RECEIVE" ? (
        <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
          Receive
        </Badge>
      ) : (
        <Badge variant="secondary">Pay</Badge>
      ),
  },
  {
    accessorKey: "party",
    header: "Party",
    cell: ({ row }) => row.original.party,
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.account}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: sortableHeader<PaymentEntryListItem>("amount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<PaymentEntryListItem>("postingAt", "Posted"),
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
