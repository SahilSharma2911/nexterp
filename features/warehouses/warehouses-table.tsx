"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { columns } from "./columns";
import { WarehouseFormDialog } from "./warehouse-form";
import { useWarehouses } from "./queries";
import type { Warehouse, WarehousesTableMeta } from "./schema";

export function WarehousesTable() {
  const [params, setParams] = useListParams();
  const [search, setSearch] = useState(params.q);

  const { data, isFetching } = useWarehouses({
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const meta: WarehousesTableMeta = {
    sort: params.sort,
    onSort: (field) => {
      const [curField, curDir] = params.sort.split(":");
      let next = `${field}:asc`;
      if (curField === field) {
        next = curDir === "asc" ? `${field}:desc` : curDir === "desc" ? "" : `${field}:asc`;
      }
      setParams({ sort: next || null, page: 1 });
    },
    onEdit: (warehouse: Warehouse) => {
      setEditId(warehouse.id);
      setDialogOpen(true);
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
            placeholder="Search warehouses…"
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditId(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New Warehouse
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        loading={isFetching && !data}
        meta={meta}
        emptyMessage="No warehouses found."
      />

      <DataTablePagination
        page={params.page}
        limit={params.limit}
        total={data?.total ?? 0}
        onPageChange={(p) => setParams({ page: p })}
        onLimitChange={(l) => setParams({ limit: l, page: 1 })}
      />

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouseId={editId}
      />
    </div>
  );
}
