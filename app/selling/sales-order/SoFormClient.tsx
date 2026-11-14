"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSalesOrder } from "@/actions/sales-order";
import { PageHeader, Button, LinkButton, Input, Select, Field, Table, Th, Td } from "@/components/ui";
import { fmtMoney } from "@/lib/format";

type ItemOpt = { id: string; itemCode: string; itemName: string; valuationRate: number };
type Opt = { id: string; name: string };
type Row = { itemId: string; qty: string; rate: string };

export default function SoFormClient({ items, customers, warehouses }: { items: ItemOpt[]; customers: Opt[]; warehouses: Opt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<Row[]>([{ itemId: "", qty: "1", rate: "" }]);

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const total = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0), 0);

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createSalesOrder({ customerId, warehouseId, deliveryDate: deliveryDate || null, remarks, items: rows.filter((r) => r.itemId).map((r) => ({ itemId: r.itemId, qty: Number(r.qty), rate: Number(r.rate) || 0 })) })) as { id: string };
        router.push(`/selling/sales-order/${res.id}`); router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Sales Order" subtitle="Draft — submit to confirm (reserves stock)">
        <LinkButton href="/selling/sales-order">Back</LinkButton>
        <Button variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 grid grid-cols-4 gap-4">
          <Field label="Customer" required><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Select</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Reserve from Warehouse" required><Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}><option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
          <Field label="Delivery Date"><Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></Field>
          <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        </div>
        <Table>
          <thead><tr><Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Selling Rate (₹)</Th><Th className="text-right">Amount</Th><Th></Th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td className="min-w-56"><Select value={r.itemId} onChange={(e) => setRow(i, { itemId: e.target.value })}><option value="">Select item</option>{items.map((it) => <option key={it.id} value={it.id}>{it.itemCode} — {it.itemName}</option>)}</Select></Td>
                <Td className="w-24 text-right"><Input type="number" className="text-right" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></Td>
                <Td className="w-32 text-right"><Input type="number" className="text-right" value={r.rate} onChange={(e) => setRow(i, { rate: e.target.value })} /></Td>
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
