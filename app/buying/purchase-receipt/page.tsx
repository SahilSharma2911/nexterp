import Link from "next/link";
import { getPurchaseReceipts } from "@/actions/purchase-receipt";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function PrListPage() {
  const rows = await getPurchaseReceipts();
  return (
    <>
      <PageHeader title="Purchase Receipt" subtitle="Receive purchased goods into stock">
        <LinkButton href="/buying/purchase-receipt/new" variant="primary">+ New Purchase Receipt</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Supplier</Th><Th>Warehouse</Th><Th className="text-right">Qty</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td><Link href={`/buying/purchase-receipt/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
              <Td>{r.supplier}</Td><Td>{r.warehouse}</Td>
              <Td className="text-right">{fmtQty(r.totalQty)}</Td><Td className="text-right">{fmtMoney(r.totalAmount)}</Td>
              <Td><StatusPill status={r.status} /></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No purchase receipts yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
