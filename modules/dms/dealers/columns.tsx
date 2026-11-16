"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Dealer } from "./schema";

export const columns: ColumnDef<Dealer>[] = [
  {
    accessorKey: "code",
    header: sortableHeader<Dealer>("code", "Code"),
    cell: ({ row }) => (
      <Link
        href={`/dms/dealers/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: sortableHeader<Dealer>("name", "Dealer"),
    cell: ({ row }) => (
      <Link
        href={`/dms/dealers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const parts = [row.original.city, row.original.state].filter(Boolean);
      return parts.length ? (
        parts.join(", ")
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "vehicleCount",
    header: "Vehicles",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.vehicleCount}</span>
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
    cell: ({ row }) => <CellAction dealer={row.original} />,
  },
];
