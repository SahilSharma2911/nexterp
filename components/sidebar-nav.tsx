"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  BookOpenCheck,
  Boxes,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  Factory,
  FileText,
  Hash,
  Layers,
  LayoutDashboard,
  Package,
  PackageCheck,
  PanelLeft,
  PanelLeftClose,
  ReceiptText,
  Scale,
  ScrollText,
  Send,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import {
  BadgeIndianRupee,
  BadgePercent,
  Building2,
  CalendarClock,
  Car,
  HardHat,
  LayoutGrid,
  ShieldCheck,
  FileWarning,
  UserCog,
  Workflow,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canSeeNav, isAdmin, type Area, type Role } from "@/lib/permissions";
import { isModuleEnabled, type ModuleId } from "@/lib/modules";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HEADING_AREA: Record<string, Area | null> = {
  Overview: null,
  Stock: "stock",
  Manufacturing: "manufacturing",
  Buying: "buying",
  Selling: "selling",
  Accounts: "accounts",
  Dealership: "dms",
};

// Which vertical module each nav group belongs to (null = always-on core).
const HEADING_MODULE: Record<string, ModuleId | null> = {
  Overview: null,
  Stock: "erp",
  Manufacturing: "erp",
  Buying: "erp",
  Selling: "erp",
  Accounts: "erp",
  Dealership: "dms",
  Settings: null,
};

export type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { heading: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Stock",
    items: [
      { href: "/stock/items", label: "Items", icon: Package },
      { href: "/stock/batches", label: "Batches", icon: Boxes },
      { href: "/stock/serials", label: "Serial Numbers", icon: Hash },
      { href: "/stock/warehouses", label: "Warehouses", icon: Warehouse },
      { href: "/stock/stock-entry", label: "Stock Entry", icon: ArrowLeftRight },
      { href: "/stock/reconciliation", label: "Reconciliation", icon: ClipboardCheck },
      { href: "/stock/ledger", label: "Stock Ledger", icon: ScrollText },
      { href: "/stock/balance", label: "Stock Balance", icon: Scale },
    ],
  },
  {
    heading: "Manufacturing",
    items: [
      { href: "/manufacturing/bom", label: "BOM", icon: Layers },
      { href: "/manufacturing/work-order", label: "Work Order", icon: Factory },
    ],
  },
  {
    heading: "Buying",
    items: [
      { href: "/buying/suppliers", label: "Suppliers", icon: Truck },
      { href: "/buying/purchase-order", label: "Purchase Order", icon: ShoppingCart },
      { href: "/buying/purchase-receipt", label: "Purchase Receipt", icon: PackageCheck },
    ],
  },
  {
    heading: "Selling",
    items: [
      { href: "/selling/customers", label: "Customers", icon: Users },
      { href: "/selling/sales-order", label: "Sales Order", icon: ShoppingBag },
      { href: "/selling/delivery-note", label: "Delivery Note", icon: Send },
    ],
  },
  {
    heading: "Accounts",
    items: [
      { href: "/accounts/chart", label: "Chart of Accounts", icon: BookOpen },
      { href: "/accounts/sales-invoice", label: "Sales Invoice", icon: FileText },
      { href: "/accounts/purchase-invoice", label: "Purchase Invoice", icon: ReceiptText },
      { href: "/accounts/payment-entry", label: "Payment Entry", icon: Wallet },
      { href: "/accounts/general-ledger", label: "General Ledger", icon: BookOpenCheck },
      { href: "/accounts/trial-balance", label: "Trial Balance", icon: Calculator },
    ],
  },
  {
    heading: "Dealership",
    items: [
      { href: "/dms/vehicles", label: "Vehicles", icon: Car },
      { href: "/dms/dealers", label: "Dealers", icon: Building2 },
      { href: "/dms/allocation", label: "Allocation", icon: Workflow },
      { href: "/dms/service-appointments", label: "Appointments", icon: CalendarClock },
      { href: "/dms/job-cards", label: "Job Cards", icon: Wrench },
      { href: "/dms/technicians", label: "Technicians", icon: HardHat },
      { href: "/dms/service-bays", label: "Service Bays", icon: LayoutGrid },
      { href: "/dms/warranties", label: "Warranties", icon: ShieldCheck },
      { href: "/dms/warranty-claims", label: "Claims", icon: FileWarning },
      { href: "/dms/subsidy-schemes", label: "Subsidy Schemes", icon: BadgePercent },
      { href: "/dms/subsidy-claims", label: "Subsidy Claims", icon: BadgeIndianRupee },
    ],
  },
  {
    heading: "Settings",
    items: [{ href: "/settings/users", label: "Users", icon: UserCog }],
  },
];

// Nav sections hidden from the sidebar for now (manager's call — not needed
// yet). The pages/routes still exist and GL postings from deliveries & job
// cards keep flowing; this only removes the menu group. Remove a heading from
// this set to show it again.
const HIDDEN_HEADINGS = new Set<string>(["Accounts"]);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Nav groups this role is allowed to see (also feeds the header quick search).
export function visibleNavGroups(role: Role): NavGroup[] {
  return NAV.filter((g) => {
    if (HIDDEN_HEADINGS.has(g.heading)) return false;
    const mod = HEADING_MODULE[g.heading];
    if (mod && !isModuleEnabled(mod)) return false;
    if (g.heading === "Settings") return isAdmin(role);
    const area = HEADING_AREA[g.heading];
    return area === null || canSeeNav(role, area);
  });
}

export function SidebarNav({
  role,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = visibleNavGroups(role);

  // Explicit open/closed overrides per section (expanded mode). A section with
  // no override defaults to open when it contains the active route.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
          active
            ? "bg-primary/[0.08] font-semibold text-primary before:absolute before:top-1.5 before:bottom-1.5 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-primary"
            : "font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex h-16 items-center",
          collapsed ? "justify-center px-0" : "gap-2.5 px-5",
        )}
      >
        {collapsed ? (
          <Image
            src="/brand/seeka-mark.png"
            alt="Seeka Motors"
            width={36}
            height={36}
            className="size-9"
            priority
          />
        ) : (
          <>
            <Image
              src="/brand/seeka-logo.png"
              alt="Seeka Motors"
              width={600}
              height={307}
              className="h-11 w-auto"
              priority
            />
            <span className="border-l border-sidebar-border pl-2.5 text-[10.5px] leading-tight font-semibold tracking-wide text-muted-foreground">
              EV Dealer
              <br />
              Network
            </span>
          </>
        )}
      </Link>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto py-2",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {collapsed
          ? // Rail mode — flat icons with tooltips.
            groups.map((group, gi) => (
              <div key={group.heading} className="mb-5">
                {gi > 0 && (
                  <div className="mx-1 mb-2 border-t border-sidebar-border/60" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-center rounded-lg p-2.5 text-sm transition-colors",
                              active
                                ? "bg-primary/[0.08] font-medium text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))
          : // Expanded mode — every section is a collapsible dropdown.
            groups.map((group) => {
              const containsActive = group.items.some((i) =>
                isActive(pathname, i.href),
              );
              const isOpen = open[group.heading] ?? containsActive;
              return (
                <div key={group.heading} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setOpen((o) => ({ ...o, [group.heading]: !isOpen }))
                    }
                    aria-expanded={isOpen}
                    className="mt-2 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10.5px] font-bold tracking-[0.12em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
                  >
                    <span>{group.heading}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        isOpen ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-200",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-0.5 pt-0.5 pb-1">
                        {group.items.map((item) => (
                          <NavLink key={item.href} item={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </nav>

      {onToggleCollapse && (
        <div className="border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
            )}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
