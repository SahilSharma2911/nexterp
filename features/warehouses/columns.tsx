"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Warehouse } from "./schema";

export const columns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: "warehouseName",
    header: sortableHeader<Warehouse>("warehouseName", "Warehouse"),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.warehouseName}</span>
    ),
  },
  {
    accessorKey: "warehouseType",
    header: sortableHeader<Warehouse>("warehouseType", "Type"),
    cell: ({ row }) =>
      row.original.warehouseType ?? (
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
    cell: ({ row }) => <CellAction warehouse={row.original} />,
  },
];
