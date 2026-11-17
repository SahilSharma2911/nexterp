"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import {
  CLAIM_STATUS_LABELS,
  type ClaimListItem,
  type ClaimStatus,
} from "./schema";

const statusStyle: Record<ClaimStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-400",
  SETTLED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyle[status],
      )}
    >
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}

export function EligibilityPill({ eligible }: { eligible: boolean | null }) {
  if (eligible == null)
    return <span className="text-muted-foreground">—</span>;
  return eligible ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <Check className="size-3.5" /> Eligible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <X className="size-3.5" /> Not eligible
    </span>
  );
}

export const columns: ColumnDef<ClaimListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<ClaimListItem>("name", "Claim"),
    cell: ({ row }) => (
      <Link
        href={`/dms/warranty-claims/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.vehicle}</span>
    ),
  },
  {
    accessorKey: "component",
    header: "Component",
    cell: ({ row }) => row.original.component,
  },
  {
    accessorKey: "claimAmount",
    header: sortableHeader<ClaimListItem>("claimAmount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.claimAmount)}</span>
    ),
  },
  {
    id: "eligible",
    header: "Eligibility",
    cell: ({ row }) => <EligibilityPill eligible={row.original.eligible} />,
  },
  {
    accessorKey: "claimDate",
    header: sortableHeader<ClaimListItem>("claimDate", "Date"),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {fmtDateTime(row.original.claimDate)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ClaimStatusBadge status={row.original.status} />,
  },
];
