import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "nexterp",
  description: "A generic ERP (ERPNext-modeled) on Next.js",
};

const NAV: { heading: string; items: { href: string; label: string }[] }[] = [
  {
    heading: "Home",
    items: [{ href: "/", label: "Dashboard" }],
  },
  {
    heading: "Stock",
    items: [
      { href: "/stock/items", label: "Item" },
      { href: "/stock/warehouses", label: "Warehouse" },
      { href: "/stock/stock-entry", label: "Stock Entry" },
      { href: "/stock/reconciliation", label: "Stock Reconciliation" },
      { href: "/stock/ledger", label: "Stock Ledger" },
      { href: "/stock/balance", label: "Stock Balance" },
    ],
  },
  {
    heading: "Manufacturing",
    items: [
      { href: "/manufacturing/bom", label: "BOM" },
      { href: "/manufacturing/work-order", label: "Work Order" },
    ],
  },
  {
    heading: "Buying",
    items: [
      { href: "/buying/suppliers", label: "Supplier" },
      { href: "/buying/purchase-order", label: "Purchase Order" },
      { href: "/buying/purchase-receipt", label: "Purchase Receipt" },
    ],
  },
  {
    heading: "Selling",
    items: [
      { href: "/selling/customers", label: "Customer" },
      { href: "/selling/sales-order", label: "Sales Order" },
      { href: "/selling/delivery-note", label: "Delivery Note" },
    ],
  },
  {
    heading: "Accounts",
    items: [
      { href: "/accounts/chart", label: "Chart of Accounts" },
      { href: "/accounts/sales-invoice", label: "Sales Invoice" },
      { href: "/accounts/purchase-invoice", label: "Purchase Invoice" },
      { href: "/accounts/payment-entry", label: "Payment Entry" },
      { href: "/accounts/general-ledger", label: "General Ledger" },
      { href: "/accounts/trial-balance", label: "Trial Balance" },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <div className="flex min-h-screen">
            <aside className="w-60 shrink-0 border-r bg-card">
              <Link href="/" className="flex h-14 items-center px-5 text-base font-semibold tracking-tight">nexterp</Link>
              <nav className="px-3 pb-6">
                {NAV.map((group) => (
                  <div key={group.heading} className="mt-4">
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.heading}</p>
                    {group.items.map((n) => (
                      <Link key={n.href} href={n.href} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                        {n.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </aside>
            <main className="flex-1 overflow-x-auto">
              <div className="mx-auto max-w-6xl p-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
