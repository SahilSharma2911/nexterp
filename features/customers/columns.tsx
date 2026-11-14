"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { CellAction } from "./cell-action";
import type { Customer } from "./schema";

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "customerName",
    header: sortableHeader<Customer>("customerName", "Customer"),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.customerName}</span>
    ),
  },
  {
    accessorKey: "customerGroup",
    header: sortableHeader<Customer>("customerGroup", "Group"),
    cell: ({ row }) =>
      row.original.customerGroup ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "territory",
    header: sortableHeader<Customer>("territory", "Territory"),
    cell: ({ row }) =>
      row.original.territory ?? (
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
    cell: ({ row }) => <CellAction customer={row.original} />,
  },
];
