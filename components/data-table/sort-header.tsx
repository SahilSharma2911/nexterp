"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Sortable header for client-side tables (ClientDataTable).
export function SortHeader<TData>({
  column,
  label,
  align = "left",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "left" | "right";
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "-ml-2.5 h-8 data-[active=true]:text-foreground",
        align === "right" && "ml-auto",
      )}
      data-active={!!sorted}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}
