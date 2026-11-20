"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  Factory,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtQty, fmtMoney } from "@/lib/format";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { DashboardCharts } from "./dashboard-charts";
import { useDashboard } from "./queries";
import { DealershipOverview } from "./dealership-overview";

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        "p-3 text-xs font-medium text-muted-foreground",
        right ? "text-right" : "text-left",
      )}
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
    <td className={cn("p-3", right && "text-right", className)}>{children}</td>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export function DashboardView() {
  const { data: d, isLoading, isFetching, refetch } = useDashboard();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview across stock, orders, production and accounts"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {isLoading || !d ? (
        <DashboardSkeleton />
      ) : (
        <>
          <StatCards
            items={
              [
                {
                  label: "Stock Value",
                  value: fmtMoney(d.kpis.stockValue),
                  href: "/stock/balance",
                  icon: Boxes,
                },
                {
                  label: "Receivables",
                  value: fmtMoney(d.kpis.receivables),
                  href: "/accounts/sales-invoice",
                  icon: ArrowDownLeft,
                  tone: d.kpis.receivables > 0 ? "negative" : "default",
                },
                {
                  label: "Payables",
                  value: fmtMoney(d.kpis.payables),
                  href: "/accounts/purchase-invoice",
                  icon: ArrowUpRight,
                  tone: d.kpis.payables > 0 ? "negative" : "default",
                },
                {
                  label: "Cash + Bank",
                  value: fmtMoney(d.kpis.cashBalance),
                  href: "/accounts/trial-balance",
                  icon: Wallet,
                  tone: "positive",
                },
              ] as StatItem[]
            }
          />

          <StatCards
            className="mt-4"
            items={
              [
                {
                  label: "Sales · this month",
                  value: fmtMoney(d.kpis.monthSales),
                  href: "/accounts/sales-invoice",
                  icon: TrendingUp,
                  tone: "positive",
                },
                {
                  label: "Purchases · this month",
                  value: fmtMoney(d.kpis.monthPurchases),
                  href: "/accounts/purchase-invoice",
                  icon: TrendingDown,
                },
                {
                  label: "Overdue Receivables",
                  value: fmtMoney(d.kpis.overdueAmount),
                  href: "/accounts/sales-invoice?status=SUBMITTED",
                  icon: CalendarClock,
                  tone: d.kpis.overdueAmount > 0 ? "negative" : "default",
                  sub:
                    d.kpis.overdueCount > 0
                      ? `${d.kpis.overdueCount} invoice${d.kpis.overdueCount === 1 ? "" : "s"} past due`
                      : "Nothing overdue",
                },
                {
                  label: "Low Stock",
                  value: d.counts.lowStockCount,
                  href: "/stock/balance",
                  icon: AlertTriangle,
                  tone: d.counts.lowStockCount > 0 ? "negative" : "default",
                  sub: "below reorder level",
                },
              ] as StatItem[]
            }
          />

          <StatCards
            className="mt-4"
            items={[
              {
                label: "Items",
                value: d.counts.itemCount,
                href: "/stock/items",
                icon: Package,
              },
              {
                label: "Open Sales Orders",
                value: d.counts.openSO,
                href: "/selling/sales-order",
                icon: ShoppingBag,
              },
              {
                label: "Open Purchase Orders",
                value: d.counts.openPO,
                href: "/buying/purchase-order",
                icon: ShoppingCart,
              },
              {
                label: "Work Orders in Progress",
                value: d.counts.openWO,
                href: "/manufacturing/work-order",
                icon: Factory,
              },
            ]}
          />

          <DashboardCharts
            trend={d.monthlyTrend}
            cashTrend={d.cashTrend}
            stockByWarehouse={d.stockByWarehouse}
          />

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

            <Panel title="Top items by value">
              <thead>
                <tr className="border-b">
                  <Th>Item</Th>
                  <Th right>On hand</Th>
                  <Th right>Value</Th>
                </tr>
              </thead>
              <tbody>
                {d.topItems.map((it) => (
                  <tr key={it.itemId} className="border-b last:border-0">
                    <Td>
                      <Link
                        href={`/stock/items/${it.itemId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {it.itemCode}
                      </Link>
                      <span className="ml-2 text-muted-foreground">
                        {it.itemName}
                      </span>
                    </Td>
                    <Td right className="tabular-nums">
                      {fmtQty(it.qty)}
                    </Td>
                    <Td right className="font-medium tabular-nums">
                      {fmtMoney(it.value)}
                    </Td>
                  </tr>
                ))}
                {d.topItems.length === 0 && (
                  <tr>
                    <Td className="text-muted-foreground">No stock yet.</Td>
                    <Td />
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

            <Panel title="Low stock items">
              <thead>
                <tr className="border-b">
                  <Th>Item</Th>
                  <Th right>On hand</Th>
                  <Th right>Reorder</Th>
                </tr>
              </thead>
              <tbody>
                {d.lowStockItems.map((it) => (
                  <tr key={it.itemId} className="border-b last:border-0">
                    <Td>
                      <Link
                        href={`/stock/items/${it.itemId}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {it.itemCode}
                      </Link>
                      <span className="ml-2 text-muted-foreground">
                        {it.itemName}
                      </span>
                    </Td>
                    <Td
                      right
                      className="font-medium tabular-nums text-red-600 dark:text-red-400"
                    >
                      {fmtQty(it.qty)}
                    </Td>
                    <Td right className="tabular-nums text-muted-foreground">
                      {fmtQty(it.reorderLevel)}
                    </Td>
                  </tr>
                ))}
                {d.lowStockItems.length === 0 && (
                  <tr>
                    <Td className="text-muted-foreground">
                      Everything above reorder level.
                    </Td>
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
                      className={cn(
                        "tabular-nums",
                        m.actualQty < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {m.actualQty > 0
                        ? `+${fmtQty(m.actualQty)}`
                        : fmtQty(m.actualQty)}
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

          <div className="mt-6">
            <DealershipOverview />
          </div>
        </>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
      <div className="grid gap-6 pt-2 lg:grid-cols-2">
        <Skeleton className="h-[324px] w-full" />
        <Skeleton className="h-[324px] w-full" />
        <Skeleton className="h-[324px] w-full lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}
