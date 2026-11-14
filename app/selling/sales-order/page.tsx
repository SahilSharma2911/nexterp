import Link from "next/link";
import { getSalesOrders } from "@/actions/sales-order";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { OrderStatusPill } from "@/components/OrderActions";
import { fmtQty, fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function SoListPage() {
  const rows = await getSalesOrders();
  return (
    <>
      <PageHeader title="Sales Order" subtitle="Confirmed customer orders"><LinkButton href="/selling/sales-order/new" variant="primary">+ New Sales Order</LinkButton></PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Customer</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id} className="hover:bg-gray-50">
            <Td><Link href={`/selling/sales-order/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
            <Td>{r.customer}</Td><Td className="text-right">{fmtQty(r.totalQty)}</Td><Td className="text-right">{fmtMoney(r.totalAmount)}</Td><Td><OrderStatusPill status={r.status} /></Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No sales orders yet.</Td><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
