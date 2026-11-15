"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { fmtQty, fmtRate, fmtMoney } from "@/lib/format";

export type StockBalanceRow = {
  id: string;
  itemCode: string;
  itemName: string;
  uom: string;
  warehouse: string;
  actualQty: number;
  reservedQty: number;
  orderedQty: number;
  projectedQty: number;
  valuationRate: number;
  stockValue: number;
};

export const columns: ColumnDef<StockBalanceRow>[] = [
  {
    accessorKey: "itemCode",
    header: ({ column }) => <SortHeader column={column} label="Item" />,
    cell: ({ row }) => (
      <span>
        <span className="font-mono text-xs font-medium">{row.original.itemCode}</span>
        <span className="ml-2 text-muted-foreground">{row.original.itemName}</span>
      </span>
    ),
  },
  {
    accessorKey: "warehouse",
    header: ({ column }) => <SortHeader column={column} label="Warehouse" />,
  },
  {
    accessorKey: "actualQty",
    header: ({ column }) => <SortHeader column={column} label="Actual" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {fmtQty(row.original.actualQty)} {row.original.uom}
      </span>
    ),
  },
  {
    accessorKey: "reservedQty",
    header: "Reserved",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.reservedQty ? fmtQty(row.original.reservedQty) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "orderedQty",
    header: "Ordered",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.orderedQty ? fmtQty(row.original.orderedQty) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "projectedQty",
    header: ({ column }) => <SortHeader column={column} label="Projected" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.projectedQty)}</span>
    ),
  },
  {
    accessorKey: "valuationRate",
    header: "Val. Rate",
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtRate(row.original.valuationRate)}</span>
    ),
  },
  {
    accessorKey: "stockValue",
    header: ({ column }) => <SortHeader column={column} label="Stock Value" />,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{fmtMoney(row.original.stockValue)}</span>
    ),
  },
];

export function StockBalanceTable({ data }: { data: StockBalanceRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search item or warehouse…"
      emptyMessage="No stock yet."
    />
  );
}
