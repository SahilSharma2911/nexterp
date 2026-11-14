"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedChartOfAccounts, upsertAccount } from "@/actions/accounts";
import { PageHeader, Button, LinkButton, Input, Select, Field } from "@/components/legacy-ui";

const ROOTS = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

export function SeedAccountsButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <Button disabled={pending} onClick={() => start(async () => { await seedChartOfAccounts(); router.refresh(); })}>{pending ? "Creating…" : "Create Standard Accounts"}</Button>;
}

type Account = { id: string; accountName: string; accountType?: string | null; rootType: string; disabled: boolean };

export function AccountFormClient({ account }: { account?: Account }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ accountName: account?.accountName ?? "", accountType: account?.accountType ?? "", rootType: account?.rootType ?? "ASSET", disabled: account?.disabled ?? false });
  const save = () => {
    setError(null);
    start(async () => {
      try { await upsertAccount({ id: account?.id, accountName: f.accountName, accountType: f.accountType, rootType: f.rootType as never, disabled: f.disabled }); router.push("/accounts/chart"); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };
  return (
    <>
      <PageHeader title={account ? account.accountName : "New Account"} subtitle="Chart of Accounts">
        <LinkButton href="/accounts/chart">Back</LinkButton>
        <Button variant="primary" disabled={pending || !f.accountName} onClick={save}>{pending ? "Saving…" : "Save"}</Button>
      </PageHeader>
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-5 grid gap-4">
        <Field label="Account Name" required><Input value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Root Type" required><Select value={f.rootType} onChange={(e) => setF({ ...f, rootType: e.target.value })}>{ROOTS.map((r) => <option key={r} value={r}>{r}</option>)}</Select></Field>
          <Field label="Account Type"><Input placeholder="Receivable, Cash, Income Account…" value={f.accountType} onChange={(e) => setF({ ...f, accountType: e.target.value })} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled</label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </>
  );
}
