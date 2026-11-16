"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { useCanWrite } from "@/components/session-context";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { columns } from "./columns";
import { useAccounts, useSeedAccounts } from "./queries";
import type { AccountsTableMeta } from "./schema";

export function ChartTable() {
  const [params, setParams] = useListParams();
  const [search, setSearch] = useState(params.q);
  const canWrite = useCanWrite("accounts");
  const seed = useSeedAccounts();

  const { data, isFetching } = useAccounts({
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

  const isEmpty = (data?.total ?? 0) === 0 && !params.q;

  const meta: AccountsTableMeta = {
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
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="pl-8"
          />
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            {isEmpty && (
              <Button
                variant="outline"
                disabled={seed.isPending}
                onClick={() => seed.mutate()}
              >
                <Sparkles className="size-4" />
                {seed.isPending ? "Adding…" : "Seed standard chart"}
              </Button>
            )}
            <Button asChild>
              <Link href="/accounts/chart/new">
                <Plus className="size-4" />
                New Account
              </Link>
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No accounts yet — create the standard chart or add one."
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
