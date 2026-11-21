"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { fmtQty } from "@/lib/format";
import { CellAction } from "./cell-action";
import type { BatchListItem, ExpiryStatus } from "./schema";

export function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const EXPIRY_STYLE: Record<ExpiryStatus, string> = {
  expired: "bg-red-500/15 text-red-600 dark:text-red-400",
  expiring: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  fresh: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  none: "bg-muted text-muted-foreground",
};

export function ExpiryBadge({
  status,
  days,
}: {
  status: ExpiryStatus;
  days: number | null;
}) {
  const text =
    status === "expired"
      ? days != null
        ? `Expired ${Math.abs(days)}d ago`
        : "Expired"
      : status === "expiring"
        ? `In ${days}d`
        : status === "fresh"
          ? "Fresh"
          : "No expiry";
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        EXPIRY_STYLE[status],
      )}
    >
      {text}
    </span>
  );
}

export const columns: ColumnDef<BatchListItem>[] = [
  {
    accessorKey: "batchNo",
    header: sortableHeader<BatchListItem>("batchNo", "Batch / Lot"),
    cell: ({ row }) => (
      <Link
        href={`/stock/batches/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.batchNo}
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
    accessorKey: "qty",
    header: sortableHeader<BatchListItem>("qty", "Qty"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.qty)}</span>
    ),
  },
  {
    accessorKey: "expiryDate",
    header: sortableHeader<BatchListItem>("expiryDate", "Expiry"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtDate(row.original.expiryDate)}</span>
    ),
  },
  {
    id: "status",
    header: "Shelf life",
    cell: ({ row }) => (
      <ExpiryBadge
        status={row.original.expiry}
        days={row.original.daysToExpiry}
      />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction batch={row.original} />,
  },
];
