"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertWarehouse } from "@/actions/warehouses";
import { PageHeader, Button, LinkButton, Input, Field } from "@/components/ui";

type Warehouse = { id: string; warehouseName: string; warehouseType?: string | null; disabled: boolean };

export default function WarehouseFormClient({ warehouse }: { warehouse?: Warehouse }) {
  const editing = !!warehouse;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    warehouseName: warehouse?.warehouseName ?? "", warehouseType: warehouse?.warehouseType ?? "", disabled: warehouse?.disabled ?? false,
  });

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await upsertWarehouse({ id: warehouse?.id, warehouseName: f.warehouseName, warehouseType: f.warehouseType, disabled: f.disabled })) as { id: string };
        router.push(`/stock/warehouses/${res.id}`);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title={editing ? warehouse!.warehouseName : "New Warehouse"} subtitle="Warehouse master">
        <LinkButton href="/stock/warehouses">Back</LinkButton>
        <Button variant="primary" disabled={pending || !f.warehouseName} onClick={save}>{pending ? "Saving…" : "Save"}</Button>
      </PageHeader>
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid gap-4">
          <Field label="Warehouse Name" required><Input value={f.warehouseName} onChange={(e) => setF({ ...f, warehouseName: e.target.value })} /></Field>
          <Field label="Warehouse Type"><Input placeholder="e.g. Store, Transit, WIP" value={f.warehouseType} onChange={(e) => setF({ ...f, warehouseType: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled</label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
