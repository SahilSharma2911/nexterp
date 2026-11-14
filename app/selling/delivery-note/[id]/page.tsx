import { notFound } from "next/navigation";
import { getDeliveryNote, submitDeliveryNote, cancelDeliveryNote } from "@/actions/delivery-note";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney, fmtDateTime } from "@/lib/format";
import DocActions from "@/components/DocActions";
export const dynamic = "force-dynamic";
export default async function DnDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getDeliveryNote(id);
  if (!r) notFound();
  return (
    <>
      <PageHeader title={r.name} subtitle={`Customer: ${r.customer}`}>
        <LinkButton href="/selling/delivery-note">Back</LinkButton>
        <DocActions id={r.id} status={r.status} onSubmit={submitDeliveryNote} onCancel={cancelDeliveryNote} />
      </PageHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3"><StatusPill status={r.status} /><span className="text-sm text-gray-500">{fmtDateTime(r.postingAt)} · from {r.warehouse}</span>{r.status !== "DRAFT" && <span className="text-sm text-gray-500">· COGS {fmtMoney(r.totalCogs)}</span>}</div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Sell Rate</Th><Th className="text-right">Amount</Th><Th className="text-right">COGS Rate</Th></tr></thead>
          <tbody>
            {r.items.map((it) => (
              <tr key={it.id}><Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td><Td className="text-right">{fmtQty(it.qty)} {it.uom}</Td><Td className="text-right">{fmtRate(it.rate)}</Td><Td className="text-right">{fmtMoney(it.amount)}</Td><Td className="text-right text-gray-500">{it.valuationRate ? fmtRate(it.valuationRate) : "—"}</Td></tr>
            ))}
            <tr><Td /><Td className="text-right font-medium">{fmtQty(r.totalQty)}</Td><Td /><Td className="text-right font-semibold">{fmtMoney(r.totalAmount)}</Td><Td /></tr>
          </tbody>
        </Table>
        {r.remarks && <p className="text-sm text-gray-500">{r.remarks}</p>}
      </div>
    </>
  );
}
