import { notFound } from "next/navigation";
import { getPurchaseReceipt, submitPurchaseReceipt, cancelPurchaseReceipt } from "@/actions/purchase-receipt";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney, fmtDateTime } from "@/lib/format";
import DocActions from "@/components/DocActions";
export const dynamic = "force-dynamic";
export default async function PrDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getPurchaseReceipt(id);
  if (!r) notFound();
  return (
    <>
      <PageHeader title={r.name} subtitle={`Supplier: ${r.supplier}`}>
        <LinkButton href="/buying/purchase-receipt">Back</LinkButton>
        <DocActions id={r.id} status={r.status} onSubmit={submitPurchaseReceipt} onCancel={cancelPurchaseReceipt} />
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><StatusPill status={r.status} /><span className="text-sm text-gray-500">{fmtDateTime(r.postingAt)} · into {r.warehouse}</span></div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th></tr></thead>
          <tbody>
            {r.items.map((it) => (
              <tr key={it.id}><Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td><Td className="text-right">{fmtQty(it.qty)} {it.uom}</Td><Td className="text-right">{fmtRate(it.rate)}</Td><Td className="text-right">{fmtMoney(it.amount)}</Td></tr>
            ))}
            <tr><Td /><Td className="text-right font-medium">{fmtQty(r.totalQty)}</Td><Td /><Td className="text-right font-semibold">{fmtMoney(r.totalAmount)}</Td></tr>
          </tbody>
        </Table>
        {r.remarks && <p className="text-sm text-gray-500">{r.remarks}</p>}
      </div>
    </>
  );
}
