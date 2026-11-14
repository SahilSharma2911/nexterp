"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStockEntry, type StockEntryPurpose } from "@/actions/stock-entry";
import { PageHeader, Button, LinkButton, Input, Select, Field, Table, Th, Td } from "@/components/ui";

type ItemOpt = { id: string; itemCode: string; itemName: string; stockUom: string; valuationRate: number };
type WhOpt = { id: string; warehouseName: string };
type Row = { itemId: string; qty: string; basicRate: string; isFinishedItem: boolean; note: string };

const PURPOSES: { value: StockEntryPurpose; label: string }[] = [
  { value: "MATERIAL_RECEIPT", label: "Material Receipt" },
  { value: "MATERIAL_ISSUE", label: "Material Issue" },
  { value: "MATERIAL_TRANSFER", label: "Material Transfer" },
  { value: "MANUFACTURE", label: "Manufacture" },
  { value: "REPACK", label: "Repack" },
];
const emptyRow = (): Row => ({ itemId: "", qty: "1", basicRate: "", isFinishedItem: false, note: "" });

export default function StockEntryFormClient({ items, warehouses }: { items: ItemOpt[]; warehouses: WhOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<StockEntryPurpose>("MATERIAL_RECEIPT");
  const [fromWh, setFromWh] = useState("");
  const [toWh, setToWh] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const showFrom = purpose !== "MATERIAL_RECEIPT";
  const showTo = purpose !== "MATERIAL_ISSUE";
  const showFinished = purpose === "MANUFACTURE" || purpose === "REPACK";
  const rateEditable = (r: Row) => purpose === "MATERIAL_RECEIPT" || (showFinished && r.isFinishedItem);

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const onPickItem = (i: number, itemId: string) => {
    const it = items.find((x) => x.id === itemId);
    setRow(i, { itemId, basicRate: it && purpose === "MATERIAL_RECEIPT" ? String(it.valuationRate || "") : rows[i].basicRate });
  };

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createStockEntry({
          purpose, fromWarehouseId: showFrom ? fromWh : null, toWarehouseId: showTo ? toWh : null, remarks,
          items: rows.filter((r) => r.itemId).map((r) => ({
            itemId: r.itemId, qty: Number(r.qty), basicRate: r.basicRate ? Number(r.basicRate) : null,
            isFinishedItem: r.isFinishedItem, note: r.note,
          })),
        })) as { id: string };
        router.push(`/stock/stock-entry/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Stock Entry" subtitle="Draft — submit to post to the ledger">
        <LinkButton href="/stock/stock-entry">Back</LinkButton>
        <Button variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Purpose" required>
              <Select value={purpose} onChange={(e) => setPurpose(e.target.value as StockEntryPurpose)}>
                {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </Field>
            {showFrom && (
              <Field label={showFinished ? "Source (raw) warehouse" : "Source warehouse"} required>
                <Select value={fromWh} onChange={(e) => setFromWh(e.target.value)}>
                  <option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                </Select>
              </Field>
            )}
            {showTo && (
              <Field label={showFinished ? "Target (finished) warehouse" : "Target warehouse"} required>
                <Select value={toWh} onChange={(e) => setToWh(e.target.value)}>
                  <option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                </Select>
              </Field>
            )}
          </div>
          <div className="mt-4"><Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field></div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Item</Th><Th className="text-right">Qty</Th><Th className="text-right">Rate (₹)</Th>
              {showFinished && <Th>Finished?</Th>}<Th>Note</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <Td className="min-w-56">
                  <Select value={r.itemId} onChange={(e) => onPickItem(i, e.target.value)}>
                    <option value="">Select item</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.itemCode} — {it.itemName}</option>)}
                  </Select>
                </Td>
                <Td className="w-28 text-right"><Input type="number" className="text-right" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></Td>
                <Td className="w-32 text-right">
                  <Input type="number" className="text-right" value={r.basicRate} disabled={!rateEditable(r)} placeholder={rateEditable(r) ? "" : "auto"} onChange={(e) => setRow(i, { basicRate: e.target.value })} />
                </Td>
                {showFinished && <Td className="w-20 text-center"><input type="checkbox" checked={r.isFinishedItem} onChange={(e) => setRow(i, { isFinishedItem: e.target.checked })} /></Td>}
                <Td><Input value={r.note} onChange={(e) => setRow(i, { note: e.target.value })} /></Td>
                <Td className="w-10"><Button variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button onClick={() => setRows([...rows, emptyRow()])}>+ Add row</Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
