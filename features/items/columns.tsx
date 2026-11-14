"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { fmtMoney } from "@/lib/format";
import { CellAction } from "./cell-action";
import type { ItemListItem } from "./schema";

export const columns: ColumnDef<ItemListItem>[] = [
  {
    accessorKey: "itemCode",
    header: sortableHeader<ItemListItem>("itemCode", "Item Code"),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.original.itemCode}
      </span>
    ),
  },
  {
    accessorKey: "itemName",
    header: sortableHeader<ItemListItem>("itemName", "Name"),
  },
  {
    accessorKey: "itemGroup",
    header: sortableHeader<ItemListItem>("itemGroup", "Group"),
    cell: ({ row }) =>
      row.original.itemGroup ?? (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "stockUom",
    header: "UOM",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.stockUom}</span>
    ),
  },
  {
    accessorKey: "valuationRate",
    header: sortableHeader<ItemListItem>("valuationRate", "Valuation"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.valuationRate)}</span>
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
    cell: ({ row, table }) => <CellAction item={row.original} table={table} />,
  },
];
