"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import {
  VEHICLE_STATUS_LABELS,
  type Vehicle,
  type VehicleStatus,
} from "./schema";
import { CellAction } from "./cell-action";

const statusStyle: Record<VehicleStatus, string> = {
  IN_STOCK: "bg-primary/10 text-primary",
  ALLOCATED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  IN_SERVICE: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyle[status],
      )}
    >
      {VEHICLE_STATUS_LABELS[status]}
    </span>
  );
}

function sohClass(soh: number) {
  if (soh >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (soh >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export const columns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: "vin",
    header: sortableHeader<Vehicle>("vin", "VIN"),
    cell: ({ row }) => (
      <Link
        href={`/dms/vehicles/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.vin}
      </Link>
    ),
  },
  {
    accessorKey: "model",
    header: sortableHeader<Vehicle>("model", "Model"),
    cell: ({ row }) => (
      <span>
        {row.original.model}
        {row.original.variant && (
          <span className="ml-1 text-muted-foreground">
            {row.original.variant}
          </span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "batterySerial",
    header: "Battery",
    cell: ({ row }) =>
      row.original.batterySerial ? (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.batterySerial}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "batterySoH",
    header: sortableHeader<Vehicle>("batterySoH", "SoH"),
    cell: ({ row }) =>
      row.original.batterySoH == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className={cn("font-medium tabular-nums", sohClass(row.original.batterySoH))}>
          {row.original.batterySoH}%
        </span>
      ),
  },
  {
    accessorKey: "warehouse",
    header: "Location",
    cell: ({ row }) =>
      row.original.warehouse ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction vehicle={row.original} />,
  },
];
