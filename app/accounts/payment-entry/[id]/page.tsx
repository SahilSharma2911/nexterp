import { notFound } from "next/navigation";
import { getPaymentEntry, submitPaymentEntry, cancelPaymentEntry } from "@/actions/payment-entry";
import { PageHeader, LinkButton, StatusPill } from "@/components/legacy-ui";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import DocActions from "@/components/DocActions";
export const dynamic = "force-dynamic";
export default async function PayDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getPaymentEntry(id);
  if (!r) notFound();
  return (
    <>
      <PageHeader title={r.name} subtitle={r.paymentType === "RECEIVE" ? "Receipt" : "Payment"}>
        <LinkButton href="/accounts/payment-entry">Back</LinkButton>
        <DocActions id={r.id} status={r.status} onSubmit={submitPaymentEntry} onCancel={cancelPaymentEntry} />
      </PageHeader>
      <div className="max-w-xl space-y-3 rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3"><StatusPill status={r.status} /><span className="text-sm text-gray-500">{fmtDateTime(r.postingAt)}</span></div>
        <Row k="Party" v={r.party} /><Row k="Account" v={r.account} /><Row k="Amount" v={fmtMoney(r.amount)} />{r.invoice && <Row k="Against Invoice" v={r.invoice} />}{r.remarks && <Row k="Remarks" v={r.remarks} />}
      </div>
    </>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span></div>; }
