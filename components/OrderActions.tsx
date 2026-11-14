"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/legacy-ui";

export function OrderStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    TO_FULFILL: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-600",
  };
  const label = status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={"inline-flex rounded px-2 py-0.5 text-xs font-medium " + (map[status] ?? "bg-gray-100 text-gray-600")}>{label}</span>;
}

export default function OrderActions({ id, status, onSubmit, onCancel }: {
  id: string; status: string;
  onSubmit: (a: { id: string }) => Promise<unknown>;
  onCancel: (a: { id: string }) => Promise<unknown>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    start(async () => { try { await fn(); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === "DRAFT" && <Button variant="primary" disabled={pending} onClick={() => run(() => onSubmit({ id }))}>{pending ? "Submitting…" : "Submit"}</Button>}
        {status === "TO_FULFILL" && <Button variant="danger" disabled={pending} onClick={() => run(() => onCancel({ id }))}>Cancel</Button>}
      </div>
      {error && <p className="max-w-md text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
