"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { HeaderContext } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

// Any table that wants sortable columns exposes this on its `meta`.
export type SortableMeta = {
  sort: string; // "field:dir" e.g. "itemCode:asc"
  onSort: (field: string) => void;
};

// Factory for a sortable column header. The parent owns the sort state via
// nuqs; clicking toggles asc → desc → off through meta.onSort.
export function sortableHeader<TData>(field: string, label: string) {
  function Header({ table }: HeaderContext<TData, unknown>) {
    const meta = table.options.meta as SortableMeta | undefined;
    const [curField, curDir] = (meta?.sort ?? "").split(":");
    const active = curField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2.5 h-8 data-[active=true]:text-foreground"
        data-active={active}
        onClick={() => meta?.onSort?.(field)}
      >
        {label}
        {active && curDir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : active && curDir === "desc" ? (
          <ArrowDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" />
        )}
      </Button>
    );
  }
  Header.displayName = `SortableHeader(${field})`;
  return Header;
}
