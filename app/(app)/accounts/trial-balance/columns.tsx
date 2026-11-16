"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { fmtMoney } from "@/lib/format";

export type TrialBalanceRow = {
  id: string;
  accountName: string;
  rootType: string;
  debit: number;
  credit: number;
  balanceDebit: number;
  balanceCredit: number;
};

export const columns: ColumnDef<TrialBalanceRow>[] = [
  {
    accessorKey: "accountName",
    header: ({ column }) => <SortHeader column={column} label="Account" />,
    cell: ({ row }) => <span className="font-medium">{row.original.accountName}</span>,
  },
  {
    accessorKey: "rootType",
    header: ({ column }) => <SortHeader column={column} label="Type" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-normal capitalize">
        {row.original.rootType.toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "balanceDebit",
    header: ({ column }) => <SortHeader column={column} label="Debit" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.balanceDebit ? fmtMoney(row.original.balanceDebit) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "balanceCredit",
    header: ({ column }) => <SortHeader column={column} label="Credit" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.balanceCredit ? fmtMoney(row.original.balanceCredit) : "—"}
      </span>
    ),
  },
];

export function TrialBalanceTable({ data }: { data: TrialBalanceRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search account…"
      emptyMessage="No balances yet."
      pageSize={100}
    />
  );
}
