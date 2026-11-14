"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertItem } from "@/actions/items";
import { PageHeader, Button, LinkButton, Input, Select, Field } from "@/components/ui";

type Item = {
  id: string; itemCode: string; itemName: string; description?: string | null; itemGroup?: string | null;
  stockUom: string; isStockItem: boolean; hasSerialNo: boolean; hasBatchNo: boolean; valuationRate: number; disabled: boolean;
};

const UOMS = ["Nos", "Unit", "Pair", "Set", "Box", "Kg", "Gram", "Litre", "Meter"];

export default function ItemFormClient({ item }: { item?: Item }) {
  const editing = !!item;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    itemCode: item?.itemCode ?? "", itemName: item?.itemName ?? "", description: item?.description ?? "",
    itemGroup: item?.itemGroup ?? "", stockUom: item?.stockUom ?? "Nos",
    valuationRate: item?.valuationRate != null ? String(item.valuationRate) : "",
    isStockItem: item?.isStockItem ?? true, hasSerialNo: item?.hasSerialNo ?? false,
    hasBatchNo: item?.hasBatchNo ?? false, disabled: item?.disabled ?? false,
  });

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await upsertItem({
          id: item?.id, itemCode: f.itemCode, itemName: f.itemName, description: f.description,
          itemGroup: f.itemGroup, stockUom: f.stockUom, valuationRate: f.valuationRate ? Number(f.valuationRate) : 0,
          isStockItem: f.isStockItem, hasSerialNo: f.hasSerialNo, hasBatchNo: f.hasBatchNo, disabled: f.disabled,
        })) as { id: string };
        router.push(`/stock/items/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title={editing ? item!.itemCode : "New Item"} subtitle="Item master">
        <LinkButton href="/stock/items">Back</LinkButton>
        <Button variant="primary" disabled={pending || !f.itemCode || !f.itemName} onClick={save}>{pending ? "Saving…" : "Save"}</Button>
      </PageHeader>

      <div className="max-w-3xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Item Code" required><Input value={f.itemCode} onChange={(e) => setF({ ...f, itemCode: e.target.value })} /></Field>
          <Field label="Item Name" required><Input value={f.itemName} onChange={(e) => setF({ ...f, itemName: e.target.value })} /></Field>
          <Field label="Item Group"><Input value={f.itemGroup} onChange={(e) => setF({ ...f, itemGroup: e.target.value })} /></Field>
          <Field label="Default UOM">
            <Select value={f.stockUom} onChange={(e) => setF({ ...f, stockUom: e.target.value })}>{UOMS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>
          </Field>
          <Field label="Valuation Rate (₹)"><Input type="number" value={f.valuationRate} onChange={(e) => setF({ ...f, valuationRate: e.target.value })} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Description"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isStockItem} onChange={(e) => setF({ ...f, isStockItem: e.target.checked })} />Maintain Stock</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.hasSerialNo} onChange={(e) => setF({ ...f, hasSerialNo: e.target.checked })} />Has Serial No</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.hasBatchNo} onChange={(e) => setF({ ...f, hasBatchNo: e.target.checked })} />Has Batch No</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled</label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
