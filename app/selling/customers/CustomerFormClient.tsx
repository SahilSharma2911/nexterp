"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertCustomer } from "@/actions/parties";
import { PageHeader, Button, LinkButton, Input, Field } from "@/components/ui";

type Customer = { id: string; customerName: string; customerGroup?: string | null; territory?: string | null; disabled: boolean };

export default function CustomerFormClient({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ customerName: customer?.customerName ?? "", customerGroup: customer?.customerGroup ?? "", territory: customer?.territory ?? "", disabled: customer?.disabled ?? false });
  const save = () => {
    setError(null);
    start(async () => {
      try { const res = (await upsertCustomer({ id: customer?.id, ...f })) as { id: string }; router.push(`/selling/customers/${res.id}`); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };
  return (
    <>
      <PageHeader title={customer ? customer.customerName : "New Customer"} subtitle="Customer master">
        <LinkButton href="/selling/customers">Back</LinkButton>
        <Button variant="primary" disabled={pending || !f.customerName} onClick={save}>{pending ? "Saving…" : "Save"}</Button>
      </PageHeader>
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid gap-4">
          <Field label="Customer Name" required><Input value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer Group"><Input value={f.customerGroup} onChange={(e) => setF({ ...f, customerGroup: e.target.value })} /></Field>
            <Field label="Territory"><Input value={f.territory} onChange={(e) => setF({ ...f, territory: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled</label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
