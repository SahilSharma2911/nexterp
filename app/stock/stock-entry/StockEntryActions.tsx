"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitStockEntry, cancelStockEntry } from "@/actions/stock-entry";
import { Button } from "@/components/ui";

export default function StockEntryActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    start(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === "DRAFT" && <Button variant="primary" disabled={pending} onClick={() => run(() => submitStockEntry({ id }))}>{pending ? "Submitting…" : "Submit"}</Button>}
        {status === "SUBMITTED" && <Button variant="danger" disabled={pending} onClick={() => run(() => cancelStockEntry({ id }))}>{pending ? "Cancelling…" : "Cancel"}</Button>}
      </div>
      {error && <p className="max-w-md whitespace-pre-line text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
