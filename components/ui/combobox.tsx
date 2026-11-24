"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

// A compact, searchable, scrollable single-select dropdown. Accepts plain
// strings or {value, label} objects (for id-based pickers).
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No match",
  className,
}: {
  options: Array<string | ComboboxOption>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const opts: ComboboxOption[] = React.useMemo(
    () =>
      options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
    [options],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
  }, [opts, query]);

  const selectedLabel = opts.find((o) => o.value === value)?.label;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-(--radix-popover-trigger-width) min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <div className="flex items-center gap-1.5 border-b px-2 pb-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-1 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none",
                    o.value === value && "bg-accent/50 font-medium",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="size-3.5 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
