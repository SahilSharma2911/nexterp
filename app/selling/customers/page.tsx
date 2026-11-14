import Link from "next/link";
import { getCustomers } from "@/actions/parties";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function CustomersPage() {
  const rows = await getCustomers();
  return (
    <>
      <PageHeader title="Customer" subtitle="Parties you sell to">
        <LinkButton href="/selling/customers/new" variant="primary">+ New Customer</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Group</Th><Th>Territory</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <Td><Link href={`/selling/customers/${c.id}`} className="font-medium text-gray-900 hover:underline">{c.customerName}</Link></Td>
              <Td>{c.customerGroup || "—"}</Td><Td>{c.territory || "—"}</Td>
              <Td className="text-xs text-gray-500">{c.disabled ? "Disabled" : "Active"}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No customers yet.</Td><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
