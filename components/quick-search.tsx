"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/permissions";
import { visibleNavGroups } from "@/components/sidebar-nav";

// Header search: jump to any screen the user can see. Ctrl/⌘+K focuses it.
export function QuickSearch({ role, className }: { role: Role; className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const all = useMemo(
    () =>
      visibleNavGroups(role).flatMap((g) =>
        g.items.map((i) => ({ ...i, group: g.heading })),
      ),
    [role],
  );
  const term = q.trim().toLowerCase();
  const results = term
    ? all.filter(
        (i) =>
          i.label.toLowerCase().includes(term) ||
          i.group.toLowerCase().includes(term),
      )
    : all.slice(0, 8);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  }

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter" && results[cursor]) {
            go(results[cursor].href);
          } else if (e.key === "Escape") {
            inputRef.current?.blur();
          }
        }}
        placeholder="Search screens…"
        aria-label="Search screens"
        className="h-10 w-full rounded-xl border border-input bg-muted/60 pr-14 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/10"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:block">
        Ctrl K
      </kbd>

      {open && (
        <div className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-[0_16px_40px_-12px_rgb(15_23_42/0.25)]">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No screens match “{q}”.
            </p>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setCursor(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm",
                    i === cursor ? "bg-accent" : "",
                  )}
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
