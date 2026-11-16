"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useCanWrite } from "@/components/session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { columns } from "./columns";
import { usePurchaseOrders } from "./queries";
import type { PurchaseOrdersTableMeta } from "./schema";

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "TO_FULFILL", label: "To Fulfil" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PurchaseOrdersTable() {
  const [params, setParams] = useListParams();
  const canWrite = useCanWrite("buying");
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ history: "push", clearOnDefault: true }),
  );
  const [search, setSearch] = useState(params.q);

  const { data, isFetching } = usePurchaseOrders({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
    status,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const meta: PurchaseOrdersTableMeta = {
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order no…"
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
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href="/buying/purchase-order/new">
              <Plus className="size-4" />
              New Purchase Order
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No purchase orders found."
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
