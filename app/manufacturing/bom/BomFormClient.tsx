"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBom } from "@/actions/bom";
import { PageHeader, Button, LinkButton, Input, Select, Field, Table, Th, Td } from "@/components/ui";
import { fmtMoney } from "@/lib/format";

type ItemOpt = { id: string; itemCode: string; itemName: string; stockUom: string; valuationRate: number };
type Row = { itemId: string; qty: string; rate: string };

export default function BomFormClient({ items }: { items: ItemOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<Row[]>([{ itemId: "", qty: "1", rate: "" }]);

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const onPick = (i: number, id: string) => {
    const it = items.find((x) => x.id === id);
    setRow(i, { itemId: id, rate: rows[i].rate || (it ? String(it.valuationRate || "") : "") });
  };
  const total = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0), 0);

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createBom({
          itemId, quantity: Number(quantity), remarks,
          items: rows.filter((r) => r.itemId).map((r) => ({ itemId: r.itemId, qty: Number(r.qty), rate: r.rate ? Number(r.rate) : null })),
        })) as { id: string };
        router.push(`/manufacturing/bom/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New BOM" subtitle="Draft — submit to activate & explode">
        <LinkButton href="/manufacturing/bom">Back</LinkButton>
        <Button variant="primary" disabled={pending || !itemId} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Finished Item" required>
              <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">Select item</option>{items.map((i) => <option key={i.id} value={i.id}>{i.itemCode} — {i.itemName}</option>)}
              </Select>
            </Field>
            <Field label="Quantity" required><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
            <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
          </div>
        </div>

        <Table>
          <thead><tr><Th>Component</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate (₹)</Th><Th className="text-right">Amount</Th><Th></Th></tr></thead>
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
        <Button onClick={() => setRows([...rows, { itemId: "", qty: "1", rate: "" }])}>+ Add component</Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
