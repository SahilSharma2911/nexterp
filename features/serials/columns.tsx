"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { CellAction } from "./cell-action";
import {
  SERIAL_STATUS_LABELS,
  type SerialListItem,
  type SerialStatus,
} from "./schema";

const STATUS_STYLE: Record<SerialStatus, string> = {
  IN_STOCK: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  DELIVERED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  SCRAPPED: "bg-muted text-muted-foreground",
};

export function SerialStatusBadge({ status }: { status: SerialStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {SERIAL_STATUS_LABELS[status]}
    </span>
  );
}

export const columns: ColumnDef<SerialListItem>[] = [
  {
    accessorKey: "serialNo",
    header: sortableHeader<SerialListItem>("serialNo", "Serial"),
    cell: ({ row }) => (
      <Link
        href={`/stock/serials/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.serialNo}
      </Link>
    ),
  },
  {
    id: "item",
    header: "Item",
    cell: ({ row }) => (
      <span className="text-sm">
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.itemCode}
        </span>{" "}
        {row.original.itemName}
      </span>
    ),
  },
  {
    id: "warehouse",
    header: "Warehouse",
    cell: ({ row }) =>
      row.original.warehouseName ? (
        <span className="text-sm">{row.original.warehouseName}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "status",
    header: sortableHeader<SerialListItem>("status", "Status"),
    cell: ({ row }) => <SerialStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction serial={row.original} />,
  },
];
