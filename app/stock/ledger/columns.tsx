"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { SortHeader } from "@/components/data-table/sort-header";
import { fmtQty, fmtRate, fmtMoney, fmtDateTime } from "@/lib/format";

export type StockLedgerRow = {
  id: string;
  postingAt: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouse: string;
  voucherType: string;
  voucherNo: string;
  actualQty: number;
  qtyAfterTransaction: number;
  valuationRate: number;
  stockValue: number;
  isCancelled: boolean;
};

export const columns: ColumnDef<StockLedgerRow>[] = [
  {
    accessorKey: "postingAt",
    header: ({ column }) => <SortHeader column={column} label="Posted" />,
    cell: ({ row }) => (
      <span
        className={cn(
          "whitespace-nowrap text-xs text-muted-foreground",
          row.original.isCancelled && "line-through",
        )}
      >
        {fmtDateTime(row.original.postingAt)}
      </span>
    ),
  },
  {
    accessorKey: "itemCode",
    header: ({ column }) => <SortHeader column={column} label="Item" />,
    cell: ({ row }) => (
      <span className={cn(row.original.isCancelled && "line-through opacity-60")}>
        <Link
          href={`/stock/items/${row.original.itemId}`}
          className="font-mono text-xs font-medium text-primary hover:underline"
        >
          {row.original.itemCode}
        </Link>
        <span className="ml-2 text-muted-foreground">{row.original.itemName}</span>
      </span>
    ),
  },
  {
    accessorKey: "warehouse",
    header: ({ column }) => <SortHeader column={column} label="Warehouse" />,
    cell: ({ row }) => (
      <Link
        href={`/stock/warehouses/${row.original.warehouseId}`}
        className="text-primary hover:underline"
      >
        {row.original.warehouse}
      </Link>
    ),
  },
  {
    accessorKey: "voucherNo",
    header: "Voucher",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.voucherNo}
      </span>
    ),
  },
  {
    accessorKey: "actualQty",
    header: ({ column }) => <SortHeader column={column} label="In / Out" />,
    cell: ({ row }) => (
      <span
        className={cn(
          "font-medium tabular-nums",
          row.original.actualQty < 0
            ? "text-red-600 dark:text-red-400"
            : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {row.original.actualQty > 0
          ? `+${fmtQty(row.original.actualQty)}`
          : fmtQty(row.original.actualQty)}
      </span>
    ),
  },
  {
    accessorKey: "qtyAfterTransaction",
    header: "Balance",
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.qtyAfterTransaction)}</span>
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
      <span className="tabular-nums">{fmtMoney(row.original.stockValue)}</span>
    ),
  },
];

export function StockLedgerTable({ data }: { data: StockLedgerRow[] }) {
  return (
    <ClientDataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search item, warehouse or voucher…"
      emptyMessage="No ledger entries yet — submit a Stock Entry."
      pageSize={50}
    />
  );
}
