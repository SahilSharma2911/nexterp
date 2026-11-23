"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";
import { useRecalls } from "./queries";
import {
  RECALL_SEVERITIES,
  RECALL_STATUSES,
  RECALL_STATUS_LABELS,
  SEVERITY_LABELS,
  type RecallsTableMeta,
} from "./schema";

export function RecallsTable() {
  const [params, setParams] = useListParams();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ history: "push", clearOnDefault: true }),
  );
  const [severity, setSeverity] = useQueryState(
    "severity",
    parseAsString.withDefault("").withOptions({ history: "push", clearOnDefault: true }),
  );
  const [search, setSearch] = useState(params.q);

  const { data, isFetching } = useRecalls({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
    status: status || undefined,
    severity: severity || undefined,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const meta: RecallsTableMeta = {
    sort: params.sort,
    onSort: (field) => {
      const [curField, curDir] = params.sort.split(":");
      let next = `${field}:asc`;
      if (curField === field)
        next =
          curDir === "asc" ? `${field}:desc` : curDir === "desc" ? "" : `${field}:asc`;
      setParams({ sort: next || null, page: 1 });
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, component…"
            className="pl-8"
          />
        </div>
        <Select
          value={severity || "all"}
          onValueChange={(v) => {
            setSeverity(v === "all" ? null : v);
            setParams({ page: 1 });
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {RECALL_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? null : v);
            setParams({ page: 1 });
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {RECALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {RECALL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No recall campaigns yet."
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
