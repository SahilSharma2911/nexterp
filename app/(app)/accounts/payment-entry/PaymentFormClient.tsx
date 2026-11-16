"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentEntry } from "@/actions/payment-entry";
import { PageHeader, Button, LinkButton, Input, Select, Field } from "@/components/legacy-ui";

type Opt = { id: string; name: string };
type Prefill = { paymentType: "RECEIVE" | "PAY"; customerId?: string; supplierId?: string; salesInvoiceId?: string; purchaseInvoiceId?: string; amount: number; partyName: string; invoiceName: string };

export default function PaymentFormClient({ accounts, customers, suppliers, prefill }: { accounts: Opt[]; customers: Opt[]; suppliers: Opt[]; prefill?: Prefill }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"RECEIVE" | "PAY">(prefill?.paymentType ?? "RECEIVE");
  const [accountId, setAccountId] = useState("");
  const [customerId, setCustomerId] = useState(prefill?.customerId ?? "");
  const [supplierId, setSupplierId] = useState(prefill?.supplierId ?? "");
  const [amount, setAmount] = useState(prefill ? String(prefill.amount) : "");
  const [remarks, setRemarks] = useState("");
  const locked = !!prefill;

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = (await createPaymentEntry({
          paymentType, accountId,
          customerId: paymentType === "RECEIVE" ? customerId : null,
          supplierId: paymentType === "PAY" ? supplierId : null,
          salesInvoiceId: prefill?.salesInvoiceId ?? null,
          purchaseInvoiceId: prefill?.purchaseInvoiceId ?? null,
          amount: Number(amount), remarks,
        })) as { id: string };
        router.push(`/accounts/payment-entry/${res.id}`); router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };

  return (
    <>
      <PageHeader title="New Payment Entry" subtitle={prefill ? `Against ${prefill.invoiceName}` : "Receive from a customer or pay a supplier"}>
        <LinkButton href="/accounts/payment-entry">Back</LinkButton>
        <Button variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save draft"}</Button>
      </PageHeader>
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-5 grid gap-4">
        <Field label="Payment Type" required>
          <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as "RECEIVE" | "PAY")} disabled={locked}>
            <option value="RECEIVE">Receive (from customer)</option>
            <option value="PAY">Pay (to supplier)</option>
          </Select>
        </Field>
        {paymentType === "RECEIVE" ? (
          <Field label="Customer" required><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={locked}><option value="">Select</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        ) : (
          <Field label="Supplier" required><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={locked}><option value="">Select</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        )}
        <Field label={paymentType === "RECEIVE" ? "Deposit to (Cash/Bank)" : "Pay from (Cash/Bank)"} required>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">Select</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
        <Field label="Amount (₹)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
