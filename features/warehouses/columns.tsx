"use client";

import Link from "next/link";
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
      <Link
        href={`/stock/warehouses/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.warehouseName}
      </Link>
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
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const parts = [row.original.city, row.original.country].filter(Boolean);
      return parts.length ? (
        parts.join(", ")
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
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
