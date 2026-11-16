import { notFound } from "next/navigation";
import { getPurchaseInvoice, submitPurchaseInvoice, cancelPurchaseInvoice } from "@/actions/purchase-invoice";
import { canWriteServer } from "@/lib/auth";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/legacy-ui";
import { fmtQty, fmtRate, fmtMoney, fmtDateTime } from "@/lib/format";
import DocActions from "@/components/DocActions";
export const dynamic = "force-dynamic";
export default async function PiDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getPurchaseInvoice(id);
  if (!r) notFound();
  const writable = await canWriteServer("accounts");
  return (
    <>
      <PageHeader title={r.name} subtitle={`Supplier: ${r.supplier}`}>
        <LinkButton href="/accounts/purchase-invoice">Back</LinkButton>
        {writable && r.status === "SUBMITTED" && r.outstanding > 0 && <LinkButton href={`/accounts/payment-entry/new?pi=${r.id}`} variant="primary">Pay</LinkButton>}
        {writable && <DocActions id={r.id} status={r.status} onSubmit={submitPurchaseInvoice} onCancel={cancelPurchaseInvoice} />}
      </PageHeader>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3"><StatusPill status={r.status} /><span className="text-sm text-gray-500">{fmtDateTime(r.postingAt)}</span><span className="text-sm">Outstanding: <span className={r.outstanding > 0 ? "font-semibold text-red-600" : "font-semibold text-green-700"}>{fmtMoney(r.outstanding)}</span></span></div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th></tr></thead>
          <tbody>
            {r.items.map((it) => (<tr key={it.id}><Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td><Td className="text-right">{fmtQty(it.qty)}</Td><Td className="text-right">{fmtRate(it.rate)}</Td><Td className="text-right">{fmtMoney(it.amount)}</Td></tr>))}
            <tr><Td /><Td /><Td className="text-right text-xs font-semibold uppercase text-gray-400">Total</Td><Td className="text-right font-semibold">{fmtMoney(r.total)}</Td></tr>
          </tbody>
        </Table>
        {r.remarks && <p className="text-sm text-gray-500">{r.remarks}</p>}
      </div>
    </>
  );
}
