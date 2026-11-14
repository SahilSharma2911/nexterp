"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrder } from "@/actions/purchase-order";
import { PageHeader, Button, LinkButton, Input, Select, Field, Table, Th, Td } from "@/components/ui";
import { fmtMoney } from "@/lib/format";

type ItemOpt = { id: string; itemCode: string; itemName: string; valuationRate: number };
type Opt = { id: string; name: string };
type Row = { itemId: string; qty: string; rate: string };

export default function PoFormClient({ items, suppliers, warehouses }: { items: ItemOpt[]; suppliers: Opt[]; warehouses: Opt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<Row[]>([{ itemId: "", qty: "1", rate: "" }]);

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const onPick = (i: number, id: string) => { const it = items.find((x) => x.id === id); setRow(i, { itemId: id, rate: rows[i].rate || (it ? String(it.valuationRate || "") : "") }); };
  const total = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0), 0);

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createPurchaseOrder({ supplierId, warehouseId, requiredBy: requiredBy || null, remarks, items: rows.filter((r) => r.itemId).map((r) => ({ itemId: r.itemId, qty: Number(r.qty), rate: Number(r.rate) || 0 })) })) as { id: string };
        router.push(`/buying/purchase-order/${res.id}`); router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Purchase Order" subtitle="Draft — submit to order (reserves ordered qty)">
        <LinkButton href="/buying/purchase-order">Back</LinkButton>
        <Button variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 grid grid-cols-4 gap-4">
          <Field label="Supplier" required><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Select</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label="Target Warehouse" required><Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}><option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="Required By"><Input type="date" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} /></Field>
          <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        </div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate (₹)</Th><Th className="text-right">Amount</Th><Th></Th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td className="min-w-56"><Select value={r.itemId} onChange={(e) => onPick(i, e.target.value)}><option value="">Select item</option>{items.map((it) => <option key={it.id} value={it.id}>{it.itemCode} — {it.itemName}</option>)}</Select></Td>
                <Td className="w-24 text-right"><Input type="number" className="text-right" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></Td>
                <Td className="w-28 text-right"><Input type="number" className="text-right" value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} /></Td>
                <Td className="w-28 text-right">{fmtMoney((Number(r.qty) || 0) * (Number(r.rate) || 0))}</Td>
                <Td className="w-10"><Button variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button></Td>
              </tr>
            ))}
            <tr><Td /><Td /><Td className="text-right text-xs font-semibold uppercase text-gray-400">Total</Td><Td className="text-right font-semibold">{fmtMoney(total)}</Td><Td /></tr>
          </tbody>
        </Table>
        <Button onClick={() => setRows([...rows, { itemId: "", qty: "1", rate: "" }])}>+ Add row</Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
