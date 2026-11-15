import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
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
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Guide · nexterp" };

type Mod = {
  href: string;
  icon: React.ElementType;
  title: string;
  what: string;
  detail: string;
};
type Section = { heading: string; blurb: string; mods: Mod[] };

const SECTIONS: Section[] = [
  {
    heading: "Overview",
    blurb: "Your home base.",
    mods: [
      {
        href: "/",
        icon: LayoutDashboard,
        title: "Dashboard",
        what: "Your numbers at a glance.",
        detail:
          "Stock value, receivables, payables, cash, and open orders — a quick health check of the whole business.",
      },
    ],
  },
  {
    heading: "Stock",
    blurb: "What you deal in, where it lives, and every movement.",
    mods: [
      {
        href: "/stock/items",
        icon: Package,
        title: "Items",
        what: "Your products & materials — the “what”.",
        detail:
          "Each item has a code (SKU), unit, price, cost, specs, and optional variants (e.g. Size/Colour). Everything else refers to items.",
      },
      {
        href: "/stock/warehouses",
        icon: Warehouse,
        title: "Warehouses",
        what: "Your stock locations — the “where”.",
        detail:
          "Stores, transit, finished-goods, etc. Stock is always counted per item per warehouse, with address & contact details.",
      },
      {
        href: "/stock/stock-entry",
        icon: ArrowLeftRight,
        title: "Stock Entry",
        what: "Internal stock moves.",
        detail:
          "Receipt (bring in), Issue (take out), Transfer (between warehouses), Manufacture (make), Repack (rebag). Submit to post, cancel to undo.",
      },
      {
        href: "/stock/reconciliation",
        icon: ClipboardCheck,
        title: "Stock Reconciliation",
        what: "Fix stock after a physical count.",
        detail:
          "Count the shelf, type the real number, submit — the system snaps its records to match and logs the difference.",
      },
      {
        href: "/stock/ledger",
        icon: ScrollText,
        title: "Stock Ledger",
        what: "The history of every movement.",
        detail:
          "One line per stock change, with the voucher that caused it. Read-only — your audit trail. Like a bank statement.",
      },
      {
        href: "/stock/balance",
        icon: Scale,
        title: "Stock Balance",
        what: "Current on-hand quantity & value.",
        detail:
          "The live number per item + warehouse (Actual, Reserved, Ordered, Projected) and its value. Like your account balance.",
      },
    ],
  },
  {
    heading: "Manufacturing",
    blurb: "Turn raw materials into finished goods.",
    mods: [
      {
        href: "/manufacturing/bom",
        icon: Layers,
        title: "BOM (Bill of Materials)",
        what: "The recipe for a product.",
        detail:
          "Lists the raw materials (and sub-assemblies) that make one finished item. Submitting it explodes multi-level recipes down to raw materials.",
      },
      {
        href: "/manufacturing/work-order",
        icon: Factory,
        title: "Work Order",
        what: "The job that makes the product.",
        detail:
          "Pick a BOM + quantity. Finishing it consumes the raw materials and receives the finished goods (via an automatic Stock Entry).",
      },
    ],
  },
  {
    heading: "Buying",
    blurb: "Order and receive goods from suppliers.",
    mods: [
      {
        href: "/buying/suppliers",
        icon: Truck,
        title: "Suppliers",
        what: "Vendors you buy from.",
        detail: "The parties on your purchase documents.",
      },
      {
        href: "/buying/purchase-order",
        icon: ShoppingCart,
        title: "Purchase Order",
        what: "Your order to a supplier.",
        detail:
          "Submitting it marks the quantity as “on the way” (Ordered). It's a promise, not stock yet.",
      },
      {
        href: "/buying/purchase-receipt",
        icon: PackageCheck,
        title: "Purchase Receipt",
        what: "Goods arriving into stock.",
        detail:
          "Receives goods against a PO (or standalone). Submitting raises stock and fulfils the order.",
      },
    ],
  },
  {
    heading: "Selling",
    blurb: "Take orders and ship to customers.",
    mods: [
      {
        href: "/selling/customers",
        icon: Users,
        title: "Customers",
        what: "Parties you sell to.",
        detail: "The parties on your sales documents.",
      },
      {
        href: "/selling/sales-order",
        icon: ShoppingBag,
        title: "Sales Order",
        what: "A customer's order.",
        detail:
          "Submitting it reserves stock for that customer so you don't sell it twice.",
      },
      {
        href: "/selling/delivery-note",
        icon: Send,
        title: "Delivery Note",
        what: "Goods shipped out.",
        detail:
          "Submitting it reduces stock, records the cost of goods delivered, and fulfils the order.",
      },
    ],
  },
  {
    heading: "Accounts",
    blurb: "The money side — what's owed, what's paid, and the books.",
    mods: [
      {
        href: "/accounts/chart",
        icon: BookOpen,
        title: "Chart of Accounts",
        what: "Your ledger accounts.",
        detail:
          "The buckets money is recorded against (Cash, Debtors, Sales, COGS…), grouped by Asset / Liability / Income / Expense / Equity.",
      },
      {
        href: "/accounts/sales-invoice",
        icon: FileText,
        title: "Sales Invoice",
        what: "Bill a customer.",
        detail:
          "Records money the customer owes you (receivables) and posts the accounting entries.",
      },
      {
        href: "/accounts/purchase-invoice",
        icon: ReceiptText,
        title: "Purchase Invoice",
        what: "A supplier's bill.",
        detail: "Records money you owe the supplier (payables).",
      },
      {
        href: "/accounts/payment-entry",
        icon: Wallet,
        title: "Payment Entry",
        what: "Money in or out.",
        detail:
          "Receipts from customers and payments to suppliers; settles invoices.",
      },
      {
        href: "/accounts/general-ledger",
        icon: BookOpenCheck,
        title: "General Ledger",
        what: "Every accounting entry.",
        detail:
          "The money version of the stock ledger — one line per debit/credit, traceable to its voucher.",
      },
      {
        href: "/accounts/trial-balance",
        icon: Calculator,
        title: "Trial Balance",
        what: "Closing balance per account.",
        detail:
          "Totals every account; debits should equal credits — proof the books are balanced.",
      },
    ],
  },
];

const FLOW = [
  { label: "Set up Items & Warehouses", icon: Package },
  { label: "Buy: Order → Receipt", icon: ShoppingCart },
  { label: "Make: BOM → Work Order", icon: Factory },
  { label: "Sell: Order → Delivery", icon: ShoppingBag },
  { label: "Money: Invoice → Payment", icon: Wallet },
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Guide"
        subtitle="What each part does — and how it all connects"
      />

      {/* How it fits together */}
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">How it all fits together</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              nexterp runs your business as connected documents. A typical loop:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <step.icon className="size-4 text-primary" />
                  {step.label}
                </span>
                {i < FLOW.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/60" />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Anything that moves stock writes to the{" "}
            <Link href="/stock/ledger" className="text-primary hover:underline">
              Stock Ledger
            </Link>
            ; anything involving money writes to the{" "}
            <Link href="/accounts/general-ledger" className="text-primary hover:underline">
              General Ledger
            </Link>
            . The balance & trial-balance reports just summarise those.
          </p>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {section.heading}
            </h2>
            <p className="text-sm text-muted-foreground">{section.blurb}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {section.mods.map((m) => (
              <Link key={m.href} href={m.href} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <m.icon className="size-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        {m.title}
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                      <p className="text-sm font-medium text-foreground/80">
                        {m.what}
                      </p>
                      <p className="text-sm text-muted-foreground">{m.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
