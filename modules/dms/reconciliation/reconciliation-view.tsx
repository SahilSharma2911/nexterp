"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  FileText,
  Landmark,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import {
  CREDIT_NOTE_STATUS_LABELS,
  type CreditNoteStatus,
} from "./schema";
import {
  useReconciliation,
  useClaimReconOptions,
  useCreateCreditNote,
  useMatchCreditNote,
} from "./queries";

const UNMATCHED = "__none__";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

const NOTE_STATUS_STYLE: Record<CreditNoteStatus, string> = {
  UNMATCHED: "bg-muted text-muted-foreground",
  MATCHED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  DISCREPANCY: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export function ReconciliationView() {
  const canWrite = useCanWrite("dms");
  const { data, isLoading } = useReconciliation();
  const { data: claimOptions = [] } = useClaimReconOptions();
  const match = useMatchCreditNote();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const stats: StatItem[] = [
    { label: "Approved value", value: compactMoney(data.totalApproved), icon: Landmark },
    { label: "Reimbursed", value: compactMoney(data.totalReimbursed), icon: Banknote, tone: "positive" },
    {
      label: "Outstanding",
      value: compactMoney(data.totalOutstanding),
      icon: CircleDollarSign,
      tone: data.totalOutstanding > 0 ? "warning" : undefined,
    },
    {
      label: "Discrepancies",
      value: data.discrepancies,
      icon: AlertTriangle,
      tone: data.discrepancies > 0 ? "warning" : undefined,
      sub: `${data.unmatchedNotes} unmatched note(s)`,
    },
  ];

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add credit note
          </Button>
        </div>
      )}

      <StatCards items={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payment aging */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment aging (outstanding)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y text-sm">
              {data.aging.map((a) => (
                <li
                  key={a.bucket}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-muted-foreground">{a.bucket}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {a.count} claim{a.count === 1 ? "" : "s"}
                    </span>
                    <span className="tabular-nums font-medium">
                      {fmtMoney(a.amount)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Reimbursement trend */}
        <CategoryBarChart
          title="Reimbursement trend (credit notes / month)"
          data={data.trend}
          emptyMessage="No reimbursements recorded."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top outstanding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top outstanding claims (by amount)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topOutstanding.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                Nothing outstanding — everything&apos;s reconciled.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {data.topOutstanding.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <Link
                      href={`/dms/warranty-claims/${c.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="truncate text-xs text-muted-foreground">
                      {c.vehicle} · {c.daysOutstanding}d
                    </span>
                    <span className="shrink-0 tabular-nums font-medium">
                      {fmtMoney(c.outstanding)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent OEM credit notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              Recent OEM credit notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentNotes.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                No credit notes yet.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {data.recentNotes.map((n) => (
                  <li key={n.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium">{n.number}</span>
                      <span className="tabular-nums">{fmtMoney(n.amount)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium",
                          NOTE_STATUS_STYLE[n.status],
                        )}
                      >
                        {CREDIT_NOTE_STATUS_LABELS[n.status]}
                        {n.status === "DISCREPANCY" && n.approvedAmount != null
                          ? ` (claim ${fmtMoney(n.approvedAmount)})`
                          : ""}
                      </span>
                      {canWrite ? (
                        <Select
                          value={n.claimId ?? UNMATCHED}
                          onValueChange={(v) =>
                            match.mutate({
                              id: n.id,
                              claimId: v === UNMATCHED ? null : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-[150px] text-xs">
                            <SelectValue placeholder="Match to claim" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNMATCHED}>Unmatched</SelectItem>
                            {claimOptions.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} · {fmtMoney(c.approvedAmount)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {n.claimName ?? "—"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AddCreditNoteDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddCreditNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: claimOptions = [] } = useClaimReconOptions();
  const create = useCreateCreditNote();
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [claimId, setClaimId] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setNumber("");
    setAmount("");
    setNoteDate("");
    setClaimId("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add OEM credit note</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="mb-1.5 block text-xs">Credit note number</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs">Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Note date</Label>
              <Input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Match to claim (optional)</Label>
            <Select
              value={claimId || UNMATCHED}
              onValueChange={(v) => setClaimId(v === UNMATCHED ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unmatched" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNMATCHED}>Unmatched</SelectItem>
                {claimOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.vehicle} · {fmtMoney(c.approvedAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button
            disabled={!number.trim() || amount === "" || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  number,
                  amount: Number(amount),
                  noteDate: noteDate || undefined,
                  claimId: claimId || undefined,
                  notes: notes || undefined,
                },
                {
                  onSuccess: () => {
                    reset();
                    onOpenChange(false);
                  },
                },
              )
            }
          >
            {create.isPending ? "Saving…" : "Add credit note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
