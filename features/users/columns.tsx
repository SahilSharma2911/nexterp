"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { sortableHeader } from "@/components/data-table/sortable-header";
import { fmtDateTime } from "@/lib/format";
import { ROLES } from "@/lib/permissions";
import { CellAction } from "./cell-action";
import type { UserRow } from "./schema";

const roleLabel = (role: string) =>
  ROLES.find((r) => r.value === role)?.label ?? role;

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: sortableHeader<UserRow>("name", "Name"),
    cell: ({ row }) => (
      <Link
        href={`/settings/users/${row.original.id}/edit`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: sortableHeader<UserRow>("email", "Email"),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: sortableHeader<UserRow>("role", "Role"),
    cell: ({ row }) => <Badge variant="secondary">{roleLabel(row.original.role)}</Badge>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.disabled ? (
        <Badge variant="secondary">Disabled</Badge>
      ) : (
        <Badge>Active</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: sortableHeader<UserRow>("createdAt", "Created"),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {fmtDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction user={row.original} />,
  },
];
