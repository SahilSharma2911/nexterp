import { notFound } from "next/navigation";
import { getBom } from "@/actions/bom";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney } from "@/lib/format";
import BomActions from "../BomActions";

export const dynamic = "force-dynamic";

export default async function BomDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const b = await getBom(id);
  if (!b) notFound();

  return (
    <>
      <PageHeader title={b.name} subtitle={`${b.itemCode} — ${b.itemName}`}>
        <LinkButton href="/manufacturing/bom">Back</LinkButton>
        <BomActions id={b.id} status={b.status} />
      </PageHeader>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={b.status} />
          {b.isDefault && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Default</span>}
          <span className="text-sm text-gray-500">Produces {fmtQty(b.quantity)} {b.uom}</span>
          <span className="text-sm text-gray-500">· Total cost {fmtMoney(b.totalCost)}</span>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Components (direct)</p>
          <Table>
            <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody>
              {b.items.map((it) => (
                <tr key={it.id}>
                  <Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td>
                  <Td className="text-right">{fmtQty(it.qty)} {it.uom}</Td>
                  <Td className="text-right">{fmtRate(it.rate)}</Td>
                  <Td className="text-right">{fmtMoney(it.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {b.explosionItems.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Exploded raw materials (multi-level)</p>
            <Table>
              <thead><tr><Th>Raw Material</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th></tr></thead>
              <tbody>
                {b.explosionItems.map((it) => (
                  <tr key={it.id}>
                    <Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td>
                    <Td className="text-right">{fmtQty(it.qty)}</Td>
                    <Td className="text-right">{fmtRate(it.rate)}</Td>
                    <Td className="text-right">{fmtMoney(it.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {b.remarks && <p className="text-sm text-gray-500">{b.remarks}</p>}
      </div>
    </>
  );
}
