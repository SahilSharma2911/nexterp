"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStockReconciliation } from "@/actions/stock-reconciliation";
import { PageHeader, Button, LinkButton, Input, Select, Field, Table, Th, Td } from "@/components/legacy-ui";
import { fmtQty } from "@/lib/format";

type ItemOpt = { id: string; itemCode: string; itemName: string; valuationRate: number };
type WhOpt = { id: string; warehouseName: string };
type Bin = { itemCode: string; warehouse: string; actualQty: number; valuationRate: number };
type Row = { itemId: string; warehouseId: string; qty: string; rate: string };

export default function ReconFormClient({ items, warehouses, bins }: { items: ItemOpt[]; warehouses: WhOpt[]; bins: Bin[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<Row[]>([{ itemId: "", warehouseId: "", qty: "0", rate: "" }]);

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const currentQty = (r: Row) => {
    const it = items.find((x) => x.id === r.itemId);
    const w = warehouses.find((x) => x.id === r.warehouseId);
    if (!it || !w) return null;
    const b = bins.find((x) => x.itemCode === it.itemCode && x.warehouse === w.warehouseName);
    return b ? b.actualQty : 0;
  };

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createStockReconciliation({
          remarks,
          items: rows.filter((r) => r.itemId && r.warehouseId).map((r) => ({ itemId: r.itemId, warehouseId: r.warehouseId, qty: Number(r.qty), valuationRate: r.rate ? Number(r.rate) : null })),
        })) as { id: string };
        router.push(`/stock/reconciliation/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Stock Reconciliation" subtitle="Draft — submit to set the balances">
        <LinkButton href="/stock/reconciliation">Back</LinkButton>
        <Button variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>
      <div className="space-y-4">
        <Table>
          <thead><tr><Th>Item</Th><Th>Warehouse</Th><Th className="text-right">Current</Th><Th className="text-right">Counted Qty</Th><Th className="text-right">Rate (₹)</Th><Th></Th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const cur = currentQty(r);
              return (
                <tr key={i}>
                  <Td className="min-w-48"><Select value={r.itemId} onChange={(e) => setRow(i, { itemId: e.target.value })}><option value="">Select</option>{items.map((it) => <option key={it.id} value={it.id}>{it.itemCode} — {it.itemName}</option>)}</Select></Td>
                  <Td className="min-w-40"><Select value={r.warehouseId} onChange={(e) => setRow(i, { warehouseId: e.target.value })}><option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</Select></Td>
                  <Td className="text-right text-sm text-gray-500">{cur == null ? "—" : fmtQty(cur)}</Td>
                  <Td className="w-28 text-right"><Input type="number" className="text-right" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></Td>
                  <Td className="w-28 text-right"><Input type="number" className="text-right" placeholder="keep" value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} /></Td>
                  <Td className="w-10"><Button variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Button onClick={() => setRows([...rows, { itemId: "", warehouseId: "", qty: "0", rate: "" }])}>+ Add row</Button>
        <div className="max-w-xl"><Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
