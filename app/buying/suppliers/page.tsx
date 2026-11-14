import Link from "next/link";
import { getSuppliers } from "@/actions/parties";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const rows = await getSuppliers();
  return (
    <>
      <PageHeader title="Supplier" subtitle="Vendors you buy from">
        <LinkButton href="/buying/suppliers/new" variant="primary">+ New Supplier</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Group</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <Td><Link href={`/buying/suppliers/${s.id}`} className="font-medium text-gray-900 hover:underline">{s.supplierName}</Link></Td>
              <Td>{s.supplierGroup || "—"}</Td>
              <Td className="text-xs text-gray-500">{s.disabled ? "Disabled" : "Active"}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No suppliers yet.</Td><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
