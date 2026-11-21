"use client";

import Link from "next/link";
import { VehicleThumb } from "@/components/vehicle-art";
import type { ColumnDef } from "@tanstack/react-table";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import {
  VEHICLE_STATUS_LABELS,
  type Vehicle,
  type VehicleStatus,
} from "./schema";
import { CellAction } from "./cell-action";

const statusStyle: Record<VehicleStatus, string> = {
  IN_STOCK: "bg-muted text-muted-foreground",
  ALLOCATED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  IN_TRANSIT: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  AT_DEALER: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  PDI_DONE: "bg-primary/10 text-primary",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  IN_SERVICE: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
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
      <div className="flex items-center gap-2">
        <VehicleThumb
          imageUrl={row.original.imageUrl}
          model={row.original.model}
          color={row.original.color}
          className="size-9"
        />
        <Link
          href={`/dms/vehicles/${row.original.id}`}
          className="font-mono text-xs font-medium text-primary hover:underline"
        >
          {row.original.vin}
        </Link>
      </div>
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
