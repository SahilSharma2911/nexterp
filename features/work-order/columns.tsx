"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { fmtQty } from "@/lib/format";
import { WorkOrderStatusBadge } from "./status-badge";
import type { WorkOrderListItem } from "./schema";

export const columns: ColumnDef<WorkOrderListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<WorkOrderListItem>("name", "Work Order"),
    cell: ({ row }) => (
      <Link
        href={`/manufacturing/work-order/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "item",
    header: "Production Item",
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
    accessorKey: "bomName",
    header: "BOM",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.bomName}
      </span>
    ),
  },
  {
    id: "progress",
    header: sortableHeader<WorkOrderListItem>("producedQty", "Produced"),
    cell: ({ row }) => (
      <span className="tabular-nums">
        {fmtQty(row.original.producedQty)}
        <span className="text-muted-foreground"> / {fmtQty(row.original.qty)}</span>
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <WorkOrderStatusBadge status={row.original.status} />,
  },
];
