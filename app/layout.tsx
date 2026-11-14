import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "nexterp",
  description: "A generic ERP (ERPNext-modeled) on Next.js",
};

const NAV: { heading: string; items: { href: string; label: string }[] }[] = [
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
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-800">
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
            <Link href="/" className="block px-4 py-3 text-base font-semibold text-gray-900">nexterp</Link>
            <nav className="px-2 pb-4">
              {NAV.map((group) => (
                <div key={group.heading} className="mt-3">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.heading}</p>
                  {group.items.map((n) => (
                    <Link key={n.href} href={n.href} className="block rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                      {n.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 overflow-x-auto">
            <div className="mx-auto max-w-6xl p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
