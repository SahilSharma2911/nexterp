import Link from "next/link";
import { getPaymentEntries } from "@/actions/payment-entry";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/legacy-ui";
import { fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function PayListPage() {
  const rows = await getPaymentEntries();
  return (
    <>
      <PageHeader title="Payment Entry" subtitle="Receipts & payments"><LinkButton href="/accounts/payment-entry/new" variant="primary">+ New Payment</LinkButton></PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Type</Th><Th>Party</Th><Th>Account</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id} className="hover:bg-gray-50">
            <Td><Link href={`/accounts/payment-entry/${r.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{r.name}</Link></Td>
            <Td>{r.paymentType === "RECEIVE" ? "Receive" : "Pay"}</Td><Td>{r.party}</Td><Td>{r.account}</Td>
            <Td className="text-right">{fmtMoney(r.amount)}</Td><Td><StatusPill status={r.status} /></Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No payments yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
