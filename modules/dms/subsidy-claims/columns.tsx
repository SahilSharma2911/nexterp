"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import {
  SUBSIDY_CLAIM_STATUS_LABELS,
  type SubsidyClaimListItem,
  type SubsidyClaimStatus,
} from "./schema";

const statusStyle: Record<SubsidyClaimStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  DISBURSED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

export function SubsidyStatusBadge({ status }: { status: SubsidyClaimStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        statusStyle[status],
      )}
    >
      {SUBSIDY_CLAIM_STATUS_LABELS[status]}
    </span>
  );
}

export function KycPill({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <ShieldCheck className="size-3.5" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <ShieldAlert className="size-3.5" /> Pending
    </span>
  );
}

export const columns: ColumnDef<SubsidyClaimListItem>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<SubsidyClaimListItem>("name", "Claim"),
    cell: ({ row }) => (
      <Link
        href={`/dms/subsidy-claims/${row.original.id}`}
        className="font-mono text-xs font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "scheme",
    header: "Scheme",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.scheme}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: sortableHeader<SubsidyClaimListItem>("customerName", "Customer"),
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.vehicle}
      </span>
    ),
  },
  {
    accessorKey: "claimAmount",
    header: sortableHeader<SubsidyClaimListItem>("claimAmount", "Amount"),
    cell: ({ row }) => (
      <span className="tabular-nums">{fmtMoney(row.original.claimAmount)}</span>
    ),
  },
  {
    id: "kyc",
    header: "KYC",
    cell: ({ row }) => <KycPill verified={row.original.kycVerified} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <SubsidyStatusBadge status={row.original.status} />,
  },
];
