import Link from "next/link";
import { getPurchaseOrders } from "@/actions/purchase-order";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { OrderStatusPill } from "@/components/OrderActions";
import { fmtQty, fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function PoListPage() {
  const rows = await getPurchaseOrders();
  return (
    <>
      <PageHeader title="Purchase Order" subtitle="Order goods from suppliers"><LinkButton href="/buying/purchase-order/new" variant="primary">+ New Purchase Order</LinkButton></PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Supplier</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id} className="hover:bg-gray-50">
            <Td><Link href={`/buying/purchase-order/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
            <Td>{r.supplier}</Td><Td className="text-right">{fmtQty(r.totalQty)}</Td><Td className="text-right">{fmtMoney(r.totalAmount)}</Td><Td><OrderStatusPill status={r.status} /></Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No purchase orders yet.</Td><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
