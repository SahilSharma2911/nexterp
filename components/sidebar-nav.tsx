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
import { cn } from "@/lib/utils";

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
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes className="size-4" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">nexterp</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
