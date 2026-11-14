"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Supplier } from "./schema";

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "supplierName",
    header: sortableHeader<Supplier>("supplierName", "Supplier"),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.supplierName}</span>
    ),
  },
  {
    accessorKey: "supplierGroup",
    header: sortableHeader<Supplier>("supplierGroup", "Group"),
    cell: ({ row }) =>
      row.original.supplierGroup ?? (
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
    cell: ({ row }) => <CellAction supplier={row.original} />,
  },
];
