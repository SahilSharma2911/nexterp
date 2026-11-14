"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { PURPOSE_LABELS, type StockEntryListItem } from "./schema";

export const columns: ColumnDef<StockEntryListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<StockEntryListItem>("name", "Entry"),
    cell: ({ row }) => (
      <Link
        href={`/stock/stock-entry/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => PURPOSE_LABELS[row.original.purpose],
  },
  {
    id: "route",
    header: "From → To",
    cell: ({ row }) => {
      const { fromWarehouse, toWarehouse } = row.original;
      return (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{fromWarehouse ?? "—"}</span>
          <ArrowRight className="size-3" />
          <span>{toWarehouse ?? "—"}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "itemCount",
    header: "Items",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.itemCount}</span>
    ),
  },
  {
    accessorKey: "valueDifference",
    header: sortableHeader<StockEntryListItem>("valueDifference", "Net Value"),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {fmtMoney(row.original.valueDifference)}
      </span>
    ),
  },
  {
    accessorKey: "postingAt",
    header: sortableHeader<StockEntryListItem>("postingAt", "Posted"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {fmtDateTime(row.original.postingAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <DocStatusBadge status={row.original.status} />,
  },
];
