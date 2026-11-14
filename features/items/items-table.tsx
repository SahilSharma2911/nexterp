"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useListParams } from "@/hooks/use-list-params";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { columns } from "./columns";
import { ItemFormDialog } from "./item-form";
import { useItems } from "./queries";
import type { ItemListItem, ItemsTableMeta } from "./schema";

export function ItemsTable() {
  const [params, setParams] = useListParams();
  const [search, setSearch] = useState(params.q);

  const { data, isFetching } = useItems({
    page: params.page,
    limit: params.limit,
    q: params.q,
    sort: params.sort,
  });

  // Debounce the search box into the URL (and reset to page 1).
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== params.q) setParams({ q: search || null, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
    onEdit: (item: ItemListItem) => {
      setEditId(item.id);
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
            placeholder="Search by code, name or group…"
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
          New Item
        </Button>
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

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemId={editId}
      />
    </div>
  );
}
