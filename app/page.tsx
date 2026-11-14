import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Factory,
  Package,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { getDashboard } from "@/actions/dashboard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtQty, fmtMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  href,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "negative"
      ? "text-red-600 dark:text-red-400"
      : tone === "positive"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
              {value}
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function Stat({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`p-3 text-xs font-medium text-muted-foreground ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  right,
  className,
}: {
  children?: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td className={`p-3 ${right ? "text-right" : ""} ${className ?? ""}`}>
      {children}
    </td>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">{children}</table>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const d = await getDashboard();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview across stock, orders, production and accounts"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Stock Value" value={fmtMoney(d.stockValue)} href="/stock/balance" icon={Boxes} />
        <Kpi label="Receivables" value={fmtMoney(d.receivables)} href="/accounts/sales-invoice" icon={ArrowDownLeft} tone={d.receivables > 0 ? "negative" : "default"} />
        <Kpi label="Payables" value={fmtMoney(d.payables)} href="/accounts/purchase-invoice" icon={ArrowUpRight} tone={d.payables > 0 ? "negative" : "default"} />
        <Kpi label="Cash + Bank" value={fmtMoney(d.cashBalance)} href="/accounts/trial-balance" icon={Wallet} tone="positive" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Items" value={String(d.itemCount)} href="/stock/items" icon={Package} />
        <Stat label="Open Sales Orders" value={String(d.openSO)} href="/selling/sales-order" icon={ShoppingBag} />
        <Stat label="Open Purchase Orders" value={String(d.openPO)} href="/buying/purchase-order" icon={ShoppingCart} />
        <Stat label="Work Orders in Progress" value={String(d.openWO)} href="/manufacturing/work-order" icon={Factory} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Stock value by warehouse">
          <thead>
            <tr className="border-b">
              <Th>Warehouse</Th>
              <Th right>Value</Th>
            </tr>
          </thead>
          <tbody>
            {d.stockByWarehouse.map((w) => (
              <tr key={w.warehouse} className="border-b last:border-0">
                <Td>{w.warehouse}</Td>
                <Td right className="font-medium tabular-nums">
                  {fmtMoney(w.value)}
                </Td>
              </tr>
            ))}
            {d.stockByWarehouse.length === 0 && (
              <tr>
                <Td className="text-muted-foreground">No stock yet.</Td>
                <Td />
              </tr>
            )}
          </tbody>
        </Panel>

        <Panel title="Open sales orders">
          <thead>
            <tr className="border-b">
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th right>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {d.openSalesOrders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <Td>
                  <Link
                    href={`/selling/sales-order/${o.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {o.name}
                  </Link>
                </Td>
                <Td>{o.customer}</Td>
                <Td right className="tabular-nums">
                  {fmtMoney(o.totalAmount)}
                </Td>
              </tr>
            ))}
            {d.openSalesOrders.length === 0 && (
              <tr>
                <Td className="text-muted-foreground">None open.</Td>
                <Td />
                <Td />
              </tr>
            )}
          </tbody>
        </Panel>

        <Panel title="Recent stock movements">
          <thead>
            <tr className="border-b">
              <Th>Item</Th>
              <Th>Warehouse</Th>
              <Th>Voucher</Th>
              <Th right>Qty</Th>
            </tr>
          </thead>
          <tbody>
            {d.recentMovements.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <Td className="font-mono text-xs">{m.itemCode}</Td>
                <Td>{m.warehouse}</Td>
                <Td className="font-mono text-xs text-muted-foreground">
                  {m.voucherNo}
                </Td>
                <Td
                  right
                  className={`tabular-nums ${m.actualQty < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {m.actualQty > 0 ? `+${fmtQty(m.actualQty)}` : fmtQty(m.actualQty)}
                </Td>
              </tr>
            ))}
            {d.recentMovements.length === 0 && (
              <tr>
                <Td className="text-muted-foreground">No movements yet.</Td>
                <Td />
                <Td />
                <Td />
              </tr>
            )}
          </tbody>
        </Panel>

        <Panel title="Recent GL entries">
          <thead>
            <tr className="border-b">
              <Th>Account</Th>
              <Th>Voucher</Th>
              <Th right>Debit</Th>
              <Th right>Credit</Th>
            </tr>
          </thead>
          <tbody>
            {d.recentGL.map((g) => (
              <tr key={g.id} className="border-b last:border-0">
                <Td className="font-medium">{g.account}</Td>
                <Td className="font-mono text-xs text-muted-foreground">
                  {g.voucherNo}
                </Td>
                <Td right className="tabular-nums">
                  {g.debit ? fmtMoney(g.debit) : "—"}
                </Td>
                <Td right className="tabular-nums">
                  {g.credit ? fmtMoney(g.credit) : "—"}
                </Td>
              </tr>
            ))}
            {d.recentGL.length === 0 && (
              <tr>
                <Td className="text-muted-foreground">No GL entries yet.</Td>
                <Td />
                <Td />
                <Td />
              </tr>
            )}
          </tbody>
        </Panel>
      </div>
    </>
  );
}
