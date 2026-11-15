"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { docsByArea } from "./content";

export function DocsNav() {
  const pathname = usePathname();
  const groups = docsByArea();

  return (
    <nav className="space-y-5 text-sm">
      <Link
        href="/docs"
        className={cn(
          "block rounded-md px-3 py-1.5 transition-colors",
          pathname === "/docs"
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        Introduction
      </Link>

      {groups.map((g) => (
        <div key={g.area}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            {g.area}
          </p>
          <div className="space-y-0.5">
            {g.docs.map((d) => {
              const href = `/docs/${d.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={d.slug}
                  href={href}
                  className={cn(
                    "block rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {d.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
