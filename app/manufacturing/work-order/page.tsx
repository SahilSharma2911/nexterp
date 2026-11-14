import Link from "next/link";
import { getWorkOrders } from "@/actions/work-order";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { fmtQty } from "@/lib/format";

export const dynamic = "force-dynamic";

function woStatusCls(s: string) {
  if (s === "COMPLETED") return "bg-green-50 text-green-700";
  if (s === "IN_PROCESS") return "bg-blue-50 text-blue-700";
  if (s === "CANCELLED") return "bg-red-50 text-red-600";
  return "bg-gray-100 text-gray-600";
}
function woLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function WorkOrderListPage() {
  const rows = await getWorkOrders();
  return (
    <>
      <PageHeader title="Work Order" subtitle="Produce finished goods from a BOM">
        <LinkButton href="/manufacturing/work-order/new" variant="primary">+ New Work Order</LinkButton>
      </PageHeader>
      <Table>
        <thead><tr><Th>Name</Th><Th>Item</Th><Th>BOM</Th><Th className="text-right">To Make</Th><Th className="text-right">Produced</Th><Th>Status</Th></tr></thead>
        <tbody>
          {rows.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50">
              <Td><Link href={`/manufacturing/work-order/${w.id}`} className="font-mono text-xs font-medium text-gray-900 hover:underline">{w.name}</Link></Td>
              <Td>{w.itemCode} <span className="text-gray-500">{w.itemName}</span></Td>
              <Td className="font-mono text-xs text-gray-500">{w.bomName}</Td>
              <Td className="text-right">{fmtQty(w.qty)}</Td>
              <Td className="text-right">{fmtQty(w.producedQty)}</Td>
              <Td><span className={"inline-flex rounded px-2 py-0.5 text-xs font-medium " + woStatusCls(w.status)}>{woLabel(w.status)}</span></Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No work orders yet.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
