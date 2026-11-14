import { getGeneralLedger } from "@/actions/accounts-reports";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { fmtMoney, fmtDateTime } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function GLPage() {
  const rows = await getGeneralLedger();
  return (
    <>
      <PageHeader title="General Ledger" subtitle="Every GL entry, most recent first (max 500)" />
      <Table>
        <thead><tr><Th>Posting</Th><Th>Account</Th><Th>Voucher</Th><Th>Against</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id} className={r.isCancelled ? "text-gray-400 line-through" : ""}>
            <Td className="whitespace-nowrap text-xs text-gray-500">{fmtDateTime(r.postingAt)}</Td>
            <Td className="font-medium">{r.account}</Td>
            <Td className="font-mono text-xs text-gray-500">{r.voucherNo}</Td>
            <Td className="text-gray-500">{r.against || "—"}</Td>
            <Td className="text-right">{r.debit ? fmtMoney(r.debit) : "—"}</Td>
            <Td className="text-right">{r.credit ? fmtMoney(r.credit) : "—"}</Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No GL entries yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
