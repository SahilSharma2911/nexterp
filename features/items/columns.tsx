"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { fmtMoney } from "@/lib/format";
import { ItemThumb } from "@/components/item-art";
import { CellAction } from "./cell-action";
import type { ItemListItem } from "./schema";

export const columns: ColumnDef<ItemListItem>[] = [
  {
    accessorKey: "itemCode",
    header: sortableHeader<ItemListItem>("itemCode", "Item Code"),
    cell: ({ row }) => (
      <Link
        href={`/stock/items/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.itemCode}
      </Link>
    ),
  },
  {
    accessorKey: "itemName",
    header: sortableHeader<ItemListItem>("itemName", "Name"),
    cell: ({ row }) => (
      <span className="flex items-center gap-2.5">
        <ItemThumb
          imageUrl={row.original.imageUrl}
          name={row.original.itemName}
          group={row.original.itemGroup}
          className="size-9"
        />
        <span className="font-medium">{row.original.itemName}</span>
        {row.original.hasVariants && (
          <Badge variant="outline" className="text-[10px]">
            Template
          </Badge>
        )}
        {row.original.isVariant && (
          <Badge variant="outline" className="text-[10px]">
            Variant
          </Badge>
        )}
      </span>
    ),
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
    accessorKey: "brand",
    header: sortableHeader<ItemListItem>("brand", "Brand"),
    cell: ({ row }) =>
      row.original.brand ?? <span className="text-muted-foreground">—</span>,
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
    id: "actions",
    cell: ({ row }) => <CellAction item={row.original} />,
  },
];
