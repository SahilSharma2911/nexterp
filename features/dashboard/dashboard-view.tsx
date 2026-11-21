"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Factory,
  Landmark,
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
import { ItemThumb } from "@/components/item-art";
import { DashboardCharts } from "./dashboard-charts";
import { useDashboard } from "./queries";
import { FleetCommand } from "./fleet-command";
import { isModuleEnabled } from "@/lib/modules";

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
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
    <td className={cn("px-4 py-2.5", right && "text-right", className)}>{children}</td>
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ElementType;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {href && (
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">{children}</table>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

// Small linked count chips — quick jumps into the busiest queues.
function CountChip({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-extrabold tabular-nums">{value}</span>
      <ArrowUpRight className="size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
    </Link>
  );
}

export function DashboardView() {
  const { data: d, isLoading, isFetching, refetch } = useDashboard();

  const dms = isModuleEnabled("dms");

  return (
    <>
      {dms && (
        <>
          <FleetCommand />
          <div className="mt-10" />
        </>
      )}
      <PageHeader
        title={dms ? "Operations" : "Dashboard"}
        subtitle="Stock, orders, production and accounts"
        actions={
          // The fleet hero already refreshes everything when DMS is on.
          dms ? undefined : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          )
        }
      />

      {isLoading || !d ? (
        <DashboardSkeleton />
      ) : (
        <div>
          <StatCards
            items={
              [
                {
                  label: "Stock Value",
                  value: fmtMoney(d.kpis.stockValue),
                  href: "/stock/balance",
                  icon: Boxes,
                  color: "blue",
                },
                {
                  label: "Cash + Bank",
                  value: fmtMoney(d.kpis.cashBalance),
                  href: "/accounts/trial-balance",
                  icon: Wallet,
                  color: "green",
                },
                {
                  label: "Receivables",
                  value: fmtMoney(d.kpis.receivables),
                  href: "/accounts/sales-invoice",
                  icon: ArrowDownLeft,
                  color: "violet",
                  sub:
                    d.kpis.overdueCount > 0
                      ? `${fmtMoney(d.kpis.overdueAmount)} overdue · ${d.kpis.overdueCount} invoice${d.kpis.overdueCount === 1 ? "" : "s"}`
                      : "Nothing overdue",
                },
                {
                  label: "Payables",
                  value: fmtMoney(d.kpis.payables),
                  href: "/accounts/purchase-invoice",
                  icon: ArrowUpRight,
                  color: "orange",
                },
              ] as StatItem[]
            }
          />

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
            <StatCards
              className="lg:col-span-2 lg:grid-cols-2"
              items={
                [
                  {
                    label: "Sales · this month",
                    value: fmtMoney(d.kpis.monthSales),
                    href: "/accounts/sales-invoice",
                    icon: TrendingUp,
                    color: "teal",
                  },
                  {
                    label: "Purchases · this month",
                    value: fmtMoney(d.kpis.monthPurchases),
                    href: "/accounts/purchase-invoice",
                    icon: TrendingDown,
                    color: "amber",
                  },
                ] as StatItem[]
              }
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <CountChip icon={Package} label="Items" value={d.counts.itemCount} href="/stock/items" />
              <CountChip
                icon={ShoppingBag}
                label="Open sales orders"
                value={d.counts.openSO}
                href="/selling/sales-order"
              />
              <CountChip
                icon={ShoppingCart}
                label="Open purchase orders"
                value={d.counts.openPO}
                href="/buying/purchase-order"
              />
              <CountChip
                icon={Factory}
                label="Work orders running"
                value={d.counts.openWO}
                href="/manufacturing/work-order"
              />
            </div>
          </div>

          <DashboardCharts
            trend={d.monthlyTrend}
            cashTrend={d.cashTrend}
            stockByWarehouse={d.stockByWarehouse}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Top items by value" icon={Package} href="/stock/balance">
              <thead>
                <tr className="border-y bg-muted/40">
                  <Th>Item</Th>
                  <Th right>On hand</Th>
                  <Th right>Value</Th>
                </tr>
              </thead>
              <tbody>
                {d.topItems.map((it) => (
                  <tr key={it.itemId} className="border-b last:border-0 hover:bg-muted/40">
                    <Td>
                      <Link href={`/stock/items/${it.itemId}`} className="flex items-center gap-3">
                        <ItemThumb name={it.itemName} className="size-9" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{it.itemName}</span>
                          <span className="font-mono text-[11px] text-primary">{it.itemCode}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td right className="tabular-nums">
                      {fmtQty(it.qty)}
                    </Td>
                    <Td right className="font-bold tabular-nums">
                      {fmtMoney(it.value)}
                    </Td>
                  </tr>
                ))}
                {d.topItems.length === 0 && <EmptyRow cols={3}>No stock yet.</EmptyRow>}
              </tbody>
            </Panel>

            <div className="flex flex-col gap-6">
              <Card className="gap-3">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Low stock
                  </CardTitle>
                  {d.lowStockItems.length > 0 && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                      {d.counts.lowStockCount} below reorder
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  {d.lowStockItems.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <CheckCircle2 className="size-8 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold">Stock levels are healthy</p>
                        <p className="text-xs text-muted-foreground">
                          Every item is above its reorder level.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {d.lowStockItems.map((it) => (
                        <li key={it.itemId}>
                          <Link
                            href={`/stock/items/${it.itemId}`}
                            className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/50"
                          >
                            <ItemThumb name={it.itemName} className="size-8" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {it.itemName}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              <b className="text-red-600 dark:text-red-400">{fmtQty(it.qty)}</b> /{" "}
                              {fmtQty(it.reorderLevel)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Panel title="Open sales orders" icon={ShoppingBag} href="/selling/sales-order">
                <thead>
                  <tr className="border-y bg-muted/40">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th right>Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.openSalesOrders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                      <Td>
                        <Link
                          href={`/selling/sales-order/${o.id}`}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {o.name}
                        </Link>
                      </Td>
                      <Td>{o.customer}</Td>
                      <Td right className="font-bold tabular-nums">
                        {fmtMoney(o.totalAmount)}
                      </Td>
                    </tr>
                  ))}
                  {d.openSalesOrders.length === 0 && (
                    <EmptyRow cols={3}>No open orders.</EmptyRow>
                  )}
                </tbody>
              </Panel>
            </div>

            <Panel title="Recent stock movements" icon={ArrowLeftRight} href="/stock/ledger">
              <thead>
                <tr className="border-y bg-muted/40">
                  <Th>Item</Th>
                  <Th>Voucher</Th>
                  <Th right>Qty</Th>
                </tr>
              </thead>
              <tbody>
                {d.recentMovements.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40">
                    <Td>
                      <span className="flex items-center gap-3">
                        <ItemThumb name={m.itemCode} className="size-8" />
                        <span className="min-w-0">
                          <span className="block font-mono text-xs font-semibold">{m.itemCode}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {m.warehouse}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td className="font-mono text-[11px] text-muted-foreground">{m.voucherNo}</Td>
                    <Td right>
                      <span
                        className={cn(
                          "inline-flex min-w-10 justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                          m.actualQty < 0
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {m.actualQty > 0 ? `+${fmtQty(m.actualQty)}` : fmtQty(m.actualQty)}
                      </span>
                    </Td>
                  </tr>
                ))}
                {d.recentMovements.length === 0 && <EmptyRow cols={3}>No movements yet.</EmptyRow>}
              </tbody>
            </Panel>

            <Panel title="Recent ledger entries" icon={Landmark} href="/accounts/general-ledger">
              <thead>
                <tr className="border-y bg-muted/40">
                  <Th>Account</Th>
                  <Th right>Debit</Th>
                  <Th right>Credit</Th>
                </tr>
              </thead>
              <tbody>
                {d.recentGL.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-muted/40">
                    <Td>
                      <span className="block font-semibold">{g.account}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{g.voucherNo}</span>
                    </Td>
                    <Td right className="tabular-nums">
                      {g.debit ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {fmtMoney(g.debit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td right className="tabular-nums">
                      {g.credit ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtMoney(g.credit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
                {d.recentGL.length === 0 && <EmptyRow cols={3}>No ledger entries yet.</EmptyRow>}
              </tbody>
            </Panel>
          </div>
        </div>
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
