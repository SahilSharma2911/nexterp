import { notFound } from "next/navigation";
import { getStockReconciliation } from "@/actions/stock-reconciliation";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import ReconActions from "../ReconActions";

export const dynamic = "force-dynamic";

export default async function ReconDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const r = await getStockReconciliation(id);
  if (!r) notFound();

  return (
    <>
      <PageHeader title={r.name} subtitle="Stock Reconciliation">
        <LinkButton href="/stock/reconciliation">Back</LinkButton>
        <ReconActions id={r.id} status={r.status} />
      </PageHeader>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><StatusPill status={r.status} /><span className="text-sm text-gray-500">{fmtDateTime(r.postingAt)}</span></div>
        <Table>
          <thead><tr><Th>Item</Th><Th>Warehouse</Th><Th className="text-right">Before</Th><Th className="text-right">Counted</Th><Th className="text-right">Diff</Th><Th className="text-right">Rate</Th></tr></thead>
          <tbody>
            {r.items.map((it) => (
              <tr key={it.id}>
                <Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td>
                <Td>{it.warehouse}</Td>
                <Td className="text-right text-gray-500">{r.status === "DRAFT" ? "—" : fmtQty(it.currentQty)}</Td>
                <Td className="text-right font-medium">{fmtQty(it.qty)} {it.uom}</Td>
                <Td className={"text-right " + (it.diff != null && it.diff < 0 ? "text-red-600" : it.diff != null && it.diff > 0 ? "text-green-700" : "text-gray-400")}>
                  {it.diff == null ? "—" : it.diff > 0 ? `+${fmtQty(it.diff)}` : fmtQty(it.diff)}
                </Td>
                <Td className="text-right">{it.valuationRate ? fmtRate(it.valuationRate) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {r.remarks && <p className="text-sm text-gray-500">{r.remarks}</p>}
      </div>
    </>
  );
}
