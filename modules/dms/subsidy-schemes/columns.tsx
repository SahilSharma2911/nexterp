"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { fmtMoney } from "@/lib/format";
import { CellAction } from "./cell-action";
import type { SubsidyScheme } from "./schema";

export const columns: ColumnDef<SubsidyScheme>[] = [
  {
    accessorKey: "code",
    header: sortableHeader<SubsidyScheme>("code", "Code"),
    cell: ({ row }) => (
      <Link
        href={`/dms/subsidy-schemes/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: sortableHeader<SubsidyScheme>("name", "Scheme"),
    cell: ({ row }) => (
      <Link
        href={`/dms/subsidy-schemes/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "authority",
    header: "Authority",
    cell: ({ row }) =>
      row.original.authority ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "amount",
    header: sortableHeader<SubsidyScheme>("amount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.amount)}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "ACTIVE" ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="secondary">Closed</Badge>
      ),
  },
  {
    accessorKey: "claimCount",
    header: "Claims",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.claimCount}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction scheme={row.original} />,
  },
];
