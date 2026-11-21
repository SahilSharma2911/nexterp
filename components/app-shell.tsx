"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { QuickSearch } from "@/components/quick-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccentPicker } from "@/components/accent-picker";
import { UserMenu } from "@/components/user-menu";
import { SessionProvider } from "@/components/session-context";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Restore the collapsed preference.
  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarNav
          role={user.role}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* Mobile drawer (always full width, never collapsed) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar text-sidebar-foreground shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-8"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </Button>
            <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 lg:px-6">
          {/* Collapse toggle (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-9 lg:flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
          </Button>
          {/* Open drawer (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
          <Image
            src="/brand/seeka-logo.png"
            alt="Seeka Motors"
            width={600}
            height={307}
            className="h-9 w-auto lg:hidden"
            priority
          />

          <QuickSearch role={user.role} className="hidden md:block" />

          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden gap-1.5 sm:flex">
              <Link href="/docs">
                <BookOpen className="size-4" />
                Docs
              </Link>
            </Button>
            <AccentPicker />
            <ThemeToggle />
            <UserMenu name={user.name} role={user.role} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-6">
          <Breadcrumbs className="mb-4 hidden lg:flex" />
          <SessionProvider user={user}>{children}</SessionProvider>
        </main>
      </div>
    </div>
  );
}
