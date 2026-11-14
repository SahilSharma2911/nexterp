import Link from "next/link";
import { getDashboard } from "@/actions/dashboard";
import { PageHeader, Table, Th, Td } from "@/components/legacy-ui";
import { fmtQty, fmtMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function Kpi({ label, value, href, accent }: { label: string; value: string; href?: string; accent?: string }) {
  const inner = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={"mt-1 text-2xl font-semibold " + (accent ?? "text-gray-900")}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const d = await getDashboard();
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview across stock, orders, production and accounts" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Stock Value" value={fmtMoney(d.stockValue)} href="/stock/balance" />
        <Kpi label="Receivables" value={fmtMoney(d.receivables)} href="/accounts/sales-invoice" accent={d.receivables > 0 ? "text-red-600" : "text-gray-900"} />
        <Kpi label="Payables" value={fmtMoney(d.payables)} href="/accounts/purchase-invoice" accent={d.payables > 0 ? "text-red-600" : "text-gray-900"} />
        <Kpi label="Cash + Bank" value={fmtMoney(d.cashBalance)} href="/accounts/trial-balance" accent="text-green-700" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Items" value={String(d.itemCount)} href="/stock/items" />
        <Kpi label="Open Sales Orders" value={String(d.openSO)} href="/selling/sales-order" />
        <Kpi label="Open Purchase Orders" value={String(d.openPO)} href="/buying/purchase-order" />
        <Kpi label="Work Orders in Progress" value={String(d.openWO)} href="/manufacturing/work-order" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Stock value by warehouse">
          <Table>
            <thead><tr><Th>Warehouse</Th><Th className="text-right">Value</Th></tr></thead>
            <tbody>
              {d.stockByWarehouse.map((w) => (<tr key={w.warehouse}><Td>{w.warehouse}</Td><Td className="text-right font-medium">{fmtMoney(w.value)}</Td></tr>))}
              {d.stockByWarehouse.length === 0 && <tr><Td className="py-4 text-center text-gray-400">No stock yet.</Td><Td /></tr>}
            </tbody>
          </Table>
        </Panel>

        <Panel title="Open sales orders">
          <Table>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody>
              {d.openSalesOrders.map((o) => (<tr key={o.id}><Td><Link href={`/selling/sales-order/${o.id}`} className="font-mono text-xs hover:underline">{o.name}</Link></Td><Td>{o.customer}</Td><Td className="text-right">{fmtMoney(o.totalAmount)}</Td></tr>))}
              {d.openSalesOrders.length === 0 && <tr><Td className="py-4 text-center text-gray-400">None open.</Td><Td /><Td /></tr>}
            </tbody>
          </Table>
        </Panel>

        <Panel title="Recent stock movements">
          <Table>
            <thead><tr><Th>Item</Th><Th>Warehouse</Th><Th>Voucher</Th><Th className="text-right">Qty</Th></tr></thead>
            <tbody>
              {d.recentMovements.map((m) => (<tr key={m.id}><Td className="font-mono text-xs">{m.itemCode}</Td><Td>{m.warehouse}</Td><Td className="font-mono text-xs text-gray-500">{m.voucherNo}</Td><Td className={"text-right " + (m.actualQty < 0 ? "text-red-600" : "text-green-700")}>{m.actualQty > 0 ? `+${fmtQty(m.actualQty)}` : fmtQty(m.actualQty)}</Td></tr>))}
              {d.recentMovements.length === 0 && <tr><Td className="py-4 text-center text-gray-400">No movements yet.</Td><Td /><Td /><Td /></tr>}
            </tbody>
          </Table>
        </Panel>

        <Panel title="Recent GL entries">
          <Table>
            <thead><tr><Th>Account</Th><Th>Voucher</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr></thead>
            <tbody>
              {d.recentGL.map((g) => (<tr key={g.id}><Td className="font-medium">{g.account}</Td><Td className="font-mono text-xs text-gray-500">{g.voucherNo}</Td><Td className="text-right">{g.debit ? fmtMoney(g.debit) : "—"}</Td><Td className="text-right">{g.credit ? fmtMoney(g.credit) : "—"}</Td></tr>))}
              {d.recentGL.length === 0 && <tr><Td className="py-4 text-center text-gray-400">No GL entries yet.</Td><Td /><Td /><Td /></tr>}
            </tbody>
          </Table>
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{title}</p>
      {children}
    </div>
  );
}
