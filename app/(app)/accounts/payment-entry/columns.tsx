"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney } from "@/lib/format";

export type PaymentEntryRow = {
  id: string;
  name: string;
  paymentType: string;
  party: string;
  account: string;
  amount: number;
  status: string;
};

export const columns: ColumnDef<PaymentEntryRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Payment" />,
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
        <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">Receive</Badge>
      ) : (
        <Badge variant="secondary">Pay</Badge>
      ),
  },
  {
    accessorKey: "party",
    header: ({ column }) => <SortHeader column={column} label="Party" />,
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
    header: ({ column }) => <SortHeader column={column} label="Amount" />,
    cell: ({ row }) => <span className="tabular-nums">{fmtMoney(row.original.amount)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <DocStatusBadge status={row.original.status} />,
  },
];

export function PaymentEntriesTable({ data }: { data: PaymentEntryRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search payment, party or account…"
      emptyMessage="No payment entries yet."
    />
  );
}
