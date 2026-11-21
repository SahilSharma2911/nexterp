"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "stock-entry" -> "Stock Entry", a uuid -> "Detail".
function labelFor(segment: string) {
  if (UUID.test(segment)) return "Detail";
  if (segment === "dms") return "Dealership";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Auto breadcrumb derived from the pathname. Top-level sections (e.g. /stock)
 * aren't real pages, so they render as plain text; deeper segments link to
 * their own path, and the last one is the current page.
 */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-sm", className)}
    >
      <Link
        href="/"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="size-4" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {segments.length === 0 && (
        <>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="font-medium text-foreground">Dashboard</span>
        </>
      )}

      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const isSection = i === 0; // e.g. "stock" — has no index page
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-muted-foreground/50" />
            {isLast || isSection ? (
              <span
                className={cn(
                  isLast ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {labelFor(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {labelFor(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
