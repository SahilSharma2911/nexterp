"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanWrite } from "@/components/session-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";
import { useWarranties } from "./queries";
import {
  COMPONENT_LABELS,
  WARRANTY_COMPONENTS,
  type WarrantiesTableMeta,
} from "./schema";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "VOID", label: "Void" },
];

const COMPONENT_OPTIONS = [
  { value: "all", label: "All components" },
  ...WARRANTY_COMPONENTS.map((c) => ({ value: c, label: COMPONENT_LABELS[c] })),
];

export function WarrantiesTable() {
  const [params, setParams] = useListParams();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString
      .withDefault("")
      .withOptions({ history: "push", clearOnDefault: true }),
  );
  const [component, setComponent] = useQueryState(
    "component",
    parseAsString
      .withDefault("")
      .withOptions({ history: "push", clearOnDefault: true }),
  );
  const [search, setSearch] = useState(params.q);
  const canWrite = useCanWrite("dms");

  const { data, isFetching } = useWarranties({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
    status,
    component,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const meta: WarrantiesTableMeta = {
    sort: params.sort,
    onSort: (field) => {
      const [curField, curDir] = params.sort.split(":");
      let next = `${field}:asc`;
      if (curField === field) {
        next =
          curDir === "asc"
            ? `${field}:desc`
            : curDir === "desc"
              ? ""
              : `${field}:asc`;
      }
      setParams({ sort: next || null, page: 1 });
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search VIN or notes…"
              className="pl-8"
            />
          </div>
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? null : v);
              setParams({ page: 1 });
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={component || "all"}
            onValueChange={(v) => {
              setComponent(v === "all" ? null : v);
              setParams({ page: 1 });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPONENT_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href="/dms/warranties/new">
              <Plus className="size-4" />
              New Warranty
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No warranties found."
      />

      <DataTablePagination
        page={params.page}
        limit={params.limit}
        total={data?.total ?? 0}
        onPageChange={(p) => setParams({ page: p })}
        onLimitChange={(l) => setParams({ limit: l, page: 1 })}
      />
    </div>
  );
}
