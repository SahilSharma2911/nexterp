import Link from "next/link";
import { getBoms } from "@/actions/bom";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BomListPage() {
  const rows = await getBoms();
  return (
    <>
      <PageHeader title="BOM" subtitle="Bill of Materials — component recipes">
        <LinkButton href="/manufacturing/bom/new" variant="primary">+ New BOM</LinkButton>
      </PageHeader>
      <Table>
        <thead>
          <tr><Th>Name</Th><Th>Finished Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Components</Th><Th className="text-right">Total Cost</Th><Th>Default</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50">
              <Td><Link href={`/manufacturing/bom/${b.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{b.name}</Link></Td>
              <Td>{b.itemCode} <span className="text-gray-500">{b.itemName}</span></Td>
              <Td className="text-right">{fmtQty(b.quantity)}</Td>
              <Td className="text-right">{b.componentCount}</Td>
              <Td className="text-right">{fmtMoney(b.totalCost)}</Td>
              <Td>{b.isDefault ? "Yes" : "—"}</Td>
              <Td><StatusPill status={b.status} /></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No BOMs yet.</Td><Td /><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
