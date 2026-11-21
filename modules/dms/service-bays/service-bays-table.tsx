"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import { columns } from "./columns";
import { useServiceBays } from "./queries";
import type { ServiceBaysTableMeta } from "./schema";

export function ServiceBaysTable() {
  const [params, setParams] = useListParams();
  const [search, setSearch] = useState(params.q);

  const { data, isFetching } = useServiceBays({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const meta: ServiceBaysTableMeta = {
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
      <div className="relative w-full max-w-sm">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bays…"
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No service bays found."
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
