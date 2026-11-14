"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertSupplier } from "@/actions/parties";
import { PageHeader, Button, LinkButton, Input, Field } from "@/components/ui";

type Supplier = { id: string; supplierName: string; supplierGroup?: string | null; disabled: boolean };

export default function SupplierFormClient({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ supplierName: supplier?.supplierName ?? "", supplierGroup: supplier?.supplierGroup ?? "", disabled: supplier?.disabled ?? false });
  const save = () => {
    setError(null);
    start(async () => {
      try { const res = (await upsertSupplier({ id: supplier?.id, ...f })) as { id: string }; router.push(`/buying/suppliers/${res.id}`); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };
  return (
    <>
      <PageHeader title={supplier ? supplier.supplierName : "New Supplier"} subtitle="Supplier master">
        <LinkButton href="/buying/suppliers">Back</LinkButton>
        <Button variant="primary" disabled={pending || !f.supplierName} onClick={save}>{pending ? "Saving…" : "Save"}</Button>
      </PageHeader>
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid gap-4">
          <Field label="Supplier Name" required><Input value={f.supplierName} onChange={(e) => setF({ ...f, supplierName: e.target.value })} /></Field>
          <Field label="Supplier Group"><Input value={f.supplierGroup} onChange={(e) => setF({ ...f, supplierGroup: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled</label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
