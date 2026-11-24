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
import { useItems } from "./queries";
import { COMMON_ITEM_GROUPS } from "./item-groups";
import type { ItemsTableMeta } from "./schema";

export function ItemsTable({ group }: { group?: string } = {}) {
  const [params, setParams] = useListParams();
  const [search, setSearch] = useState(params.q);
  // User-selectable group filter — only used when a group isn't locked by the page.
  const [groupFilter, setGroupFilter] = useQueryState(
    "group",
    parseAsString
      .withDefault("")
      .withOptions({ history: "push", clearOnDefault: true }),
  );
  const activeGroup = group ?? (groupFilter || undefined);

  const { data, isFetching } = useItems({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
    group: activeGroup,
  });

  // Debounce the search box into the URL (and reset to page 1).
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const meta: ItemsTableMeta = {
    sort: params.sort,
    onSort: (field) => {
      const [curField, curDir] = params.sort.split(":");
      let next = `${field}:asc`;
      if (curField === field) {
        next = curDir === "asc" ? `${field}:desc` : curDir === "desc" ? "" : `${field}:asc`;
      }
      setParams({ sort: next || null, page: 1 });
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, group or brand…"
            className="pl-8"
          />
        </div>
        {!group && (
          <Select
            value={groupFilter || "all"}
            onValueChange={(v) => {
              setGroupFilter(v === "all" ? null : v);
              setParams({ page: 1 });
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {COMMON_ITEM_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No items found."
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
