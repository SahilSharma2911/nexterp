import Link from "next/link";
import { getStockEntries } from "@/actions/stock-entry";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function purposeLabel(p: string) {
  return p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function StockEntryListPage() {
  const rows = await getStockEntries();
  return (
    <>
      <PageHeader title="Stock Entry" subtitle="Receipt · Issue · Transfer · Manufacture">
        <LinkButton href="/stock/stock-entry/new" variant="primary">+ New Stock Entry</LinkButton>
      </PageHeader>
      <Table>
        <thead>
          <tr><Th>Name</Th><Th>Purpose</Th><Th>From → To</Th><Th className="text-right">Items</Th><Th className="text-right">Value Δ</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td><Link href={`/stock/stock-entry/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
              <Td>{purposeLabel(r.purpose)}</Td>
              <Td className="text-sm text-gray-600">{(r.fromWarehouse || "—")} → {(r.toWarehouse || "—")}</Td>
              <Td className="text-right">{r.itemCount}</Td>
              <Td className="text-right">{fmtMoney(r.valueDifference)}</Td>
              <Td><StatusPill status={r.status} /></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No stock entries yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
