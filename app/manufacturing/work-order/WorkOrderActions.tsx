"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishWorkOrder, cancelWorkOrder } from "@/actions/work-order";
import { Button, Input } from "@/components/ui";

export default function WorkOrderActions({ id, status, remaining }: { id: string; status: string; remaining: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(String(remaining));
  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    start(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    });
  };
  const canProduce = status === "NOT_STARTED" || status === "IN_PROCESS";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {canProduce && (
          <>
            <span className="text-xs text-gray-500">Qty</span>
            <Input type="number" className="h-8 w-20 text-right" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Button variant="primary" disabled={pending} onClick={() => run(() => finishWorkOrder({ id, qty: Number(qty) }))}>{pending ? "Producing…" : "Finish"}</Button>
          </>
        )}
        {status === "NOT_STARTED" && <Button variant="danger" disabled={pending} onClick={() => run(() => cancelWorkOrder({ id }))}>Cancel</Button>}
      </div>
      {error && <p className="max-w-md whitespace-pre-line text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
