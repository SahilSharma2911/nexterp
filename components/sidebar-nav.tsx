"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  BookOpenCheck,
  Boxes,
  Calculator,
  ClipboardCheck,
  Factory,
  FileText,
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
  Car,
  ShieldCheck,
  FileWarning,
  UserCog,
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

type NavItem = { href: string; label: string; icon: React.ElementType };
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
      { href: "/dms/job-cards", label: "Job Cards", icon: Wrench },
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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
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
  const groups = NAV.filter((g) => {
    const mod = HEADING_MODULE[g.heading];
    if (mod && !isModuleEnabled(mod)) return false;
    if (g.heading === "Settings") return isAdmin(role);
    const area = HEADING_AREA[g.heading];
    return area === null || canSeeNav(role, area);
  });

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "gap-2 px-5",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes className="size-4" />
        </span>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight">
            nexterp
          </span>
        )}
      </Link>

      <nav className={cn("min-h-0 flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        {groups.map((group, gi) => (
          <div key={group.heading} className="mb-5">
            {collapsed ? (
              gi > 0 && (
                <div className="mx-1 mb-2 border-t border-sidebar-border/60" />
              )
            ) : (
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const className = cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                );
                const content = (
                  <>
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && item.label}
                  </>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={className}
                        >
                          {content}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
