import Link from "next/link";
import { getAccounts } from "@/actions/accounts";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/legacy-ui";
import { SeedAccountsButton } from "./ChartClients";
export const dynamic = "force-dynamic";
export default async function ChartPage() {
  const rows = await getAccounts();
  return (
    <>
      <PageHeader title="Chart of Accounts" subtitle="Ledger accounts">
        {rows.length === 0 && <SeedAccountsButton />}
        <LinkButton href="/accounts/chart/new" variant="primary">+ New Account</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Account</Th><Th>Root Type</Th><Th>Type</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((a) => (<tr key={a.id} className="hover:bg-gray-50">
            <Td><Link href={`/accounts/chart/${a.id}`} className="font-medium text-gray-900 hover:underline">{a.accountName}</Link></Td>
            <Td>{a.rootType}</Td><Td className="text-gray-500">{a.accountType || "—"}</Td><Td className="text-xs text-gray-500">{a.disabled ? "Disabled" : "Active"}</Td>
          </tr>))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No accounts. Click “Create Standard Accounts”.</Td><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
