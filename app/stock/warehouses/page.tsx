import Link from "next/link";
import { getWarehouses } from "@/actions/warehouses";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const rows = await getWarehouses();
  return (
    <>
      <PageHeader title="Warehouse" subtitle="Stocking locations">
        <LinkButton href="/stock/warehouses/new" variant="primary">+ New Warehouse</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Type</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50">
              <Td><Link href={`/stock/warehouses/${w.id}`} className="font-medium text-gray-900 hover:underline">{w.warehouseName}</Link></Td>
              <Td>{w.warehouseType || "—"}</Td>
              <Td className="text-xs text-gray-500">{w.disabled ? "Disabled" : "Active"}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No warehouses yet.</Td><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
