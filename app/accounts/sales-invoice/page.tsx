import Link from "next/link";
import { getSalesInvoices } from "@/actions/sales-invoice";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/legacy-ui";
import { fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function SiListPage() {
  const rows = await getSalesInvoices();
  return (
    <>
      <PageHeader title="Sales Invoice" subtitle="Bill customers"><LinkButton href="/accounts/sales-invoice/new" variant="primary">+ New Sales Invoice</LinkButton></PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Customer</Th><Th className="text-right">Total</Th><Th className="text-right">Outstanding</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id} className="hover:bg-gray-50">
            <Td><Link href={`/accounts/sales-invoice/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
            <Td>{r.customer}</Td><Td className="text-right">{fmtMoney(r.total)}</Td>
            <Td className={"text-right " + (r.outstanding > 0 ? "text-red-600" : "text-green-700")}>{fmtMoney(r.outstanding)}</Td>
            <Td><StatusPill status={r.status} /></Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No sales invoices yet.</Td><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
