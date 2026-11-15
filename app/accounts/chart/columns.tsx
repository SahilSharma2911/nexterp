"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";

export type AccountRow = {
  id: string;
  accountName: string;
  accountType: string | null;
  rootType: string;
  disabled: boolean;
};

export const columns: ColumnDef<AccountRow>[] = [
  {
    accessorKey: "accountName",
    header: ({ column }) => <SortHeader column={column} label="Account" />,
    cell: ({ row }) => (
      <Link
        href={`/accounts/chart/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.accountName}
      </Link>
    ),
  },
  {
    accessorKey: "rootType",
    header: ({ column }) => <SortHeader column={column} label="Root Type" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-normal capitalize">
        {row.original.rootType.toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "accountType",
    header: "Type",
    cell: ({ row }) =>
      row.original.accountType ?? <span className="text-muted-foreground">—</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.disabled ? (
        <Badge variant="secondary">Disabled</Badge>
      ) : (
        <Badge>Active</Badge>
      ),
  },
];

export function AccountsTable({ data }: { data: AccountRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search account…"
      emptyMessage="No accounts yet — create the standard chart or add one."
      pageSize={50}
    />
  );
}
