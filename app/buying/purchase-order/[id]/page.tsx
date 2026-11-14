import { notFound } from "next/navigation";
import { getPurchaseOrder, submitPurchaseOrder, cancelPurchaseOrder } from "@/actions/purchase-order";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney } from "@/lib/format";
import OrderActions, { OrderStatusPill } from "@/components/OrderActions";
export const dynamic = "force-dynamic";
export default async function PoDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getPurchaseOrder(id);
  if (!r) notFound();
  return (
    <>
      <PageHeader title={r.name} subtitle={`Supplier: ${r.supplier}`}>
        <LinkButton href="/buying/purchase-order">Back</LinkButton>
        {r.status === "TO_FULFILL" && <LinkButton href={`/buying/purchase-receipt/new?po=${r.id}`} variant="primary">Create Purchase Receipt</LinkButton>}
        <OrderActions id={r.id} status={r.status} onSubmit={submitPurchaseOrder} onCancel={cancelPurchaseOrder} />
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><OrderStatusPill status={r.status} /><span className="text-sm text-gray-500">Into {r.warehouse}</span></div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Ordered</Th><Th className="text-right">Received</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th></tr></thead>
          <tbody>
            {r.items.map((it) => (<tr key={it.id}><Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td><Td className="text-right">{fmtQty(it.qty)}</Td><Td className="text-right">{fmtQty(it.receivedQty)}</Td><Td className="text-right">{fmtRate(it.rate)}</Td><Td className="text-right">{fmtMoney(it.amount)}</Td></tr>))}
            <tr><Td /><Td className="text-right font-medium">{fmtQty(r.totalQty)}</Td><Td /><Td /><Td className="text-right font-semibold">{fmtMoney(r.totalAmount)}</Td></tr>
          </tbody>
        </Table>
        {r.remarks && <p className="text-sm text-gray-500">{r.remarks}</p>}
      </div>
    </>
  );
}
