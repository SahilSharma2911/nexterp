"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Technician } from "./schema";

export const columns: ColumnDef<Technician>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<Technician>("name", "Technician"),
    cell: ({ row }) => (
      <Link
        href={`/dms/technicians/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "skills",
    header: "Skills",
    cell: ({ row }) =>
      row.original.skills ? (
        <span className="text-sm">{row.original.skills}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "hv",
    header: "HV Certified",
    cell: ({ row }) =>
      row.original.isHVCertified ? (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
          HV
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
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
    cell: ({ row }) => <CellAction technician={row.original} />,
  },
];
