"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { ServiceBay } from "./schema";

export const columns: ColumnDef<ServiceBay>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<ServiceBay>("name", "Bay"),
    cell: ({ row }) => (
      <Link
        href={`/dms/service-bays/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "hv",
    header: "Type",
    cell: ({ row }) =>
      row.original.isHV ? (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
          HV bay
        </Badge>
      ) : (
        <Badge variant="secondary">Standard</Badge>
      ),
  },
  {
    accessorKey: "jobCount",
    header: "Jobs",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.jobCount}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.active ? (
        <Badge>Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction bay={row.original} />,
  },
];
