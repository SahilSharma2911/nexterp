import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkOrder } from "@/actions/work-order";
import { PageHeader, LinkButton, Table, Th, Td } from "@/components/ui";
import { fmtQty, fmtRate } from "@/lib/format";
import WorkOrderActions from "../WorkOrderActions";

export const dynamic = "force-dynamic";

function woLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function WorkOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const w = await getWorkOrder(id);
  if (!w) notFound();
  const remaining = Math.max(0, Math.round((w.qty - w.producedQty) * 1e6) / 1e6);

  return (
    <>
      <PageHeader title={w.name} subtitle={`${w.itemCode} — ${w.itemName}`}>
        <LinkButton href="/manufacturing/work-order">Back</LinkButton>
        <WorkOrderActions id={w.id} status={w.status} remaining={remaining} />
      </PageHeader>

      <div className="space-y-5">
        <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-4">
          <Info label="Status" value={woLabel(w.status)} />
          <Info label="BOM" value={w.bomName} />
          <Info label="To make / produced" value={`${fmtQty(w.qty)} / ${fmtQty(w.producedQty)} ${w.uom}`} />
          <Info label="Multi-level" value={w.useMultiLevelBom ? "Yes" : "No"} />
          <Info label="Source warehouse" value={w.sourceWarehouse} />
          <Info label="FG warehouse" value={w.fgWarehouse} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Required materials</p>
          <Table>
            <thead><tr><Th>Item</Th><Th className="text-right">Required</Th><Th className="text-right">Consumed</Th><Th className="text-right">Rate</Th></tr></thead>
            <tbody>
              {w.items.map((it) => (
                <tr key={it.id}>
                  <Td>{it.itemCode} <span className="text-gray-500">{it.itemName}</span></Td>
                  <Td className="text-right">{fmtQty(it.requiredQty)}</Td>
                  <Td className="text-right">{fmtQty(it.consumedQty)}</Td>
                  <Td className="text-right">{fmtRate(it.rate)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {w.stockEntries.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Manufacture entries</p>
            <div className="flex flex-wrap gap-2">
              {w.stockEntries.map((se) => (
                <Link key={se.id} href={`/stock/stock-entry/${se.id}`} className="rounded border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs text-gray-700 hover:bg-gray-50">{se.name}</Link>
              ))}
            </div>
          </div>
        )}
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
