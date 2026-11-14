"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkOrder } from "@/actions/work-order";
import { PageHeader, Button, LinkButton, Input, Select, Field } from "@/components/ui";

type BomOpt = { id: string; name: string; itemCode: string; itemName: string; quantity: number };
type WhOpt = { id: string; warehouseName: string };

export default function WorkOrderFormClient({ boms, warehouses, defaultBomId }: { boms: BomOpt[]; warehouses: WhOpt[]; defaultBomId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bomId, setBomId] = useState(defaultBomId && boms.some((b) => b.id === defaultBomId) ? defaultBomId : "");
  const [qty, setQty] = useState("1");
  const [sourceWh, setSourceWh] = useState("");
  const [fgWh, setFgWh] = useState("");
  const [multi, setMulti] = useState(true);
  const [remarks, setRemarks] = useState("");

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createWorkOrder({ bomId, qty: Number(qty), sourceWarehouseId: sourceWh || null, fgWarehouseId: fgWh || null, useMultiLevelBom: multi, remarks })) as { id: string };
        router.push(`/manufacturing/work-order/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Work Order" subtitle="Plan a production run">
        <LinkButton href="/manufacturing/work-order">Back</LinkButton>
        <Button variant="primary" disabled={pending || !bomId} onClick={save}>{pending ? "Saving…" : "Create"}</Button>
      </PageHeader>
      <div className="max-w-3xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="BOM" required>
            <Select value={bomId} onChange={(e) => setBomId(e.target.value)}>
              <option value="">Select BOM</option>
              {boms.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.itemCode}</option>)}
            </Select>
          </Field>
          <Field label="Qty to Manufacture" required><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Field label="Source (raw) Warehouse">
            <Select value={sourceWh} onChange={(e) => setSourceWh(e.target.value)}><option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</Select>
          </Field>
          <Field label="Finished Goods Warehouse">
            <Select value={fgWh} onChange={(e) => setFgWh(e.target.value)}><option value="">Select</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}</Select>
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />Use multi-level BOM (consume exploded raw materials)</label>
        <div className="mt-4"><Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field></div>
        {!boms.length && <p className="mt-3 text-sm text-amber-600">No submitted BOM available — create and submit a BOM first.</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
