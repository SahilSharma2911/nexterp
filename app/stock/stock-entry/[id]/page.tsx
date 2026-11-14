import { notFound } from "next/navigation";
import { getStockEntry } from "@/actions/stock-entry";
import { PageHeader, LinkButton, Table, Th, Td, StatusPill } from "@/components/ui";
import { fmtMoney, fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import StockEntryActions from "../StockEntryActions";

export const dynamic = "force-dynamic";

function purposeLabel(p: string) {
  return p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function StockEntryDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const e = await getStockEntry(id);
  if (!e) notFound();
  const showFinished = e.purpose === "MANUFACTURE" || e.purpose === "REPACK";

  return (
    <>
      <PageHeader title={e.name} subtitle={purposeLabel(e.purpose)}>
        <LinkButton href="/stock/stock-entry">Back</LinkButton>
        <StockEntryActions id={e.id} status={e.status} />
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusPill status={e.status} />
          <span className="text-sm text-gray-500">{fmtDateTime(e.postingAt)}</span>
        </div>

        <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-4">
          <Info label="Source" value={e.fromWarehouse} />
          <Info label="Target" value={e.toWarehouse} />
          <Info label="Incoming value" value={fmtMoney(e.totalIncomingValue)} />
          <Info label="Outgoing value" value={fmtMoney(e.totalOutgoingValue)} />
          {e.remarks && <div className="sm:col-span-4"><Info label="Remarks" value={e.remarks} /></div>}
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate</Th><Th className="text-right">Amount</Th>
              {showFinished && <Th>Finished</Th>}<Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {e.items.map((it) => (
              <tr key={it.id}>
                <Td>{it.itemCode} <span className="text-gray-500">— {it.itemName}</span></Td>
                <Td className="text-right">{fmtQty(it.qty)} {it.uom}</Td>
                <Td className="text-right">{fmtRate(it.valuationRate || it.basicRate)}</Td>
                <Td className="text-right">{fmtMoney(it.amount)}</Td>
                {showFinished && <Td>{it.isFinishedItem ? "Yes" : "—"}</Td>}
                <Td className="text-gray-500">{it.note || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value || "—"}</p>
    </div>
  );
}
