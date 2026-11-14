import Link from "next/link";

const CARDS = [
  { href: "/stock/items", title: "Item", desc: "Products / materials master" },
  { href: "/stock/warehouses", title: "Warehouse", desc: "Stocking locations" },
  { href: "/stock/stock-entry", title: "Stock Entry", desc: "Receipt · Issue · Transfer · Manufacture" },
  { href: "/stock/ledger", title: "Stock Ledger", desc: "Immutable movement ledger" },
  { href: "/stock/balance", title: "Stock Balance", desc: "On-hand qty & value per warehouse" },
];

export default function Home() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Stock</h1>
      <p className="mt-1 text-sm text-gray-500">Inventory, modeled on ERPNext&apos;s Stock Ledger.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm">
            <p className="font-medium text-gray-900">{c.title}</p>
            <p className="mt-1 text-sm text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
