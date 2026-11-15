"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export type GLRow = {
  id: string;
  postingAt: string;
  account: string;
  voucherType: string;
  voucherNo: string;
  against: string | null;
  debit: number;
  credit: number;
  isCancelled: boolean;
};

export const columns: ColumnDef<GLRow>[] = [
  {
    accessorKey: "postingAt",
    header: ({ column }) => <SortHeader column={column} label="Posted" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {fmtDateTime(row.original.postingAt)}
      </span>
    ),
  },
  {
    accessorKey: "account",
    header: ({ column }) => <SortHeader column={column} label="Account" />,
    cell: ({ row }) => (
      <span className={cn("font-medium", row.original.isCancelled && "line-through opacity-60")}>
        {row.original.account}
      </span>
    ),
  },
  {
    accessorKey: "voucherNo",
    header: "Voucher",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.voucherNo}
      </span>
    ),
  },
  {
    accessorKey: "against",
    header: "Against",
    cell: ({ row }) => row.original.against ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "debit",
    header: ({ column }) => <SortHeader column={column} label="Debit" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.debit ? fmtMoney(row.original.debit) : "—"}</span>
    ),
  },
  {
    accessorKey: "credit",
    header: ({ column }) => <SortHeader column={column} label="Credit" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.credit ? fmtMoney(row.original.credit) : "—"}</span>
    ),
  },
];

export function GeneralLedgerTable({ data }: { data: GLRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search account, voucher or party…"
      emptyMessage="No GL entries yet."
      pageSize={50}
    />
  );
}
