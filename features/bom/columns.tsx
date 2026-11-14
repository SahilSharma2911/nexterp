"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtQty } from "@/lib/format";
import type { BomListItem } from "./schema";

export const columns: ColumnDef<BomListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<BomListItem>("name", "BOM"),
    cell: ({ row }) => (
      <Link
        href={`/manufacturing/bom/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "finished",
    header: "Finished Item",
    cell: ({ row }) => (
      <span>
        <span className="font-mono text-xs">{row.original.itemCode}</span>
        <span className="ml-2 text-muted-foreground">
          {row.original.itemName}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: sortableHeader<BomListItem>("quantity", "Qty"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtQty(row.original.quantity)}</span>
    ),
  },
  {
    accessorKey: "componentCount",
    header: "Components",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.componentCount}</span>
    ),
  },
  {
    accessorKey: "totalCost",
    header: sortableHeader<BomListItem>("totalCost", "Total Cost"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.totalCost)}</span>
    ),
  },
  {
    id: "flags",
    header: "",
    cell: ({ row }) =>
      row.original.isDefault ? (
        <Badge variant="outline">Default</Badge>
      ) : null,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <DocStatusBadge status={row.original.status} />,
  },
];
