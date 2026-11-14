import Link from "next/link";
import { getItems } from "@/actions/items";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { fmtRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getItems();
  return (
    <>
      <PageHeader title="Item" subtitle="Product / material master">
        <LinkButton href="/stock/items/new" variant="primary">+ New Item</LinkButton>
      </PageHeader>
      <Table>
        <thead>
          <tr><Th>Item Code</Th><Th>Item Name</Th><Th>Group</Th><Th>UOM</Th><Th className="text-right">Valuation</Th><Th>Flags</Th></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-gray-50">
              <Td><Link href={`/stock/items/${i.id}`} className="font-medium text-gray-900 hover:underline">{i.itemCode}</Link></Td>
              <Td>{i.itemName}</Td>
              <Td>{i.itemGroup || "—"}</Td>
              <Td>{i.stockUom}</Td>
              <Td className="text-right">{fmtRate(i.valuationRate)}</Td>
              <Td className="text-xs text-gray-500">{[i.hasSerialNo && "Serial", i.hasBatchNo && "Batch", i.disabled && "Disabled"].filter(Boolean).join(", ") || "—"}</Td>
            </tr>
          ))}
          {items.length === 0 && <tr><Td className="py-6 text-center text-gray-400"><span className="block">No items yet.</span></Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
