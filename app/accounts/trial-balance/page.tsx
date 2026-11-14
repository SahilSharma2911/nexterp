import { getTrialBalance } from "@/actions/accounts-reports";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function TrialBalancePage() {
  const { rows, totalDr, totalCr } = await getTrialBalance();
  return (
    <>
      <PageHeader title="Trial Balance" subtitle="Account balances (debits must equal credits)" />
      <Table>
        <thead><tr><Th>Account</Th><Th>Root Type</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr></thead>
        <tbody>
          {rows.map((r) => (<tr key={r.id}>
            <Td className="font-medium">{r.accountName}</Td><Td className="text-gray-500">{r.rootType}</Td>
            <Td className="text-right">{r.balanceDebit ? fmtMoney(r.balanceDebit) : "—"}</Td>
            <Td className="text-right">{r.balanceCredit ? fmtMoney(r.balanceCredit) : "—"}</Td>
          </tr>))}
          <tr className="font-semibold"><Td>Total</Td><Td /><Td className="text-right">{fmtMoney(totalDr)}</Td><Td className="text-right">{fmtMoney(totalCr)}</Td></tr>
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No postings yet.</Td><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
