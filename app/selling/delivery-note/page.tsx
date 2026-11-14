import Link from "next/link";
import { getDeliveryNotes } from "@/actions/delivery-note";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function DnListPage() {
  const rows = await getDeliveryNotes();
  return (
    <>
      <PageHeader title="Delivery Note" subtitle="Ship goods to customers (stock out)">
        <LinkButton href="/selling/delivery-note/new" variant="primary">+ New Delivery Note</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Customer</Th><Th>Warehouse</Th><Th className="text-right">Qty</Th><Th className="text-right">Value</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td><Link href={`/selling/delivery-note/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
              <Td>{r.customer}</Td><Td>{r.warehouse}</Td>
              <Td className="text-right">{fmtQty(r.totalQty)}</Td><Td className="text-right">{fmtMoney(r.totalAmount)}</Td>
              <Td><StatusPill status={r.status} /></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No delivery notes yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
