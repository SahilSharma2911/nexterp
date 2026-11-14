import Link from "next/link";
import { getStockReconciliations } from "@/actions/stock-reconciliation";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReconListPage() {
  const rows = await getStockReconciliations();
  return (
    <>
      <PageHeader title="Stock Reconciliation" subtitle="Set physical-count / opening stock">
        <LinkButton href="/stock/reconciliation/new" variant="primary">+ New Reconciliation</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Posting</Th><Th className="text-right">Rows</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td><Link href={`/stock/reconciliation/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
              <Td className="text-sm text-gray-500">{fmtDateTime(r.postingAt)}</Td>
              <Td className="text-right">{r.itemCount}</Td>
              <Td><StatusPill status={r.status} /></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No reconciliations yet.</Td><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
