"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import { COMPONENT_LABELS, type Warranty } from "./schema";

export const columns: ColumnDef<Warranty>[] = [
  {
    id: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => (
      <Link
        href={`/dms/warranties/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.vehicle}
      </Link>
    ),
  },
  {
    accessorKey: "component",
    header: sortableHeader<Warranty>("component", "Component"),
    cell: ({ row }) => (
      <Badge variant="secondary">
        {COMPONENT_LABELS[row.original.component]}
      </Badge>
    ),
  },
  {
    accessorKey: "startDate",
    header: sortableHeader<Warranty>("startDate", "Start"),
    cell: ({ row }) =>
      new Date(row.original.startDate).toLocaleDateString(),
  },
  {
    id: "coverage",
    header: "Coverage",
    cell: ({ row }) => (
      <span className="tabular-nums">{`${row.original.months} mo`}</span>
    ),
  },
  {
    id: "expiry",
    header: "Expiry",
    cell: ({ row }) =>
      new Date(row.original.expiryDate).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: sortableHeader<Warranty>("status", "Status"),
    cell: ({ row }) => {
      const w = row.original;
      if (w.status === "VOID") return <Badge variant="destructive">Void</Badge>;
      return w.active ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="secondary">Expired</Badge>
      );
    },
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
    cell: ({ row }) => <CellAction warranty={row.original} />,
  },
];
