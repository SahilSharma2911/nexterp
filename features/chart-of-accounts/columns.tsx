"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Account } from "./schema";

export const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "accountName",
    header: sortableHeader<Account>("accountName", "Account"),
    cell: ({ row }) => (
      <Link
        href={`/accounts/chart/${row.original.id}/edit`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.accountName}
      </Link>
    ),
  },
  {
    accessorKey: "rootType",
    header: sortableHeader<Account>("rootType", "Root Type"),
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
      row.original.accountType ?? (
        <span className="text-muted-foreground">—</span>
      ),
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
  {
    id: "actions",
    cell: ({ row }) => <CellAction account={row.original} />,
  },
];
