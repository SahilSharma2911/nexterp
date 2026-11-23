"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CircleDollarSign,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { useAddClaimComment, useReimburseClaim } from "./queries";
import type { ClaimDetail, ClaimEvent, ClaimEventKind } from "./schema";

const EVENT_UI: Record<ClaimEventKind, { icon: React.ElementType; cls: string }> = {
  CREATED: { icon: FileText, cls: "text-muted-foreground" },
  SUBMITTED: { icon: Send, cls: "text-sky-600 dark:text-sky-400" },
  COMMENT: { icon: MessageSquare, cls: "text-violet-600 dark:text-violet-400" },
  APPROVED: { icon: BadgeCheck, cls: "text-emerald-600 dark:text-emerald-400" },
  REJECTED: { icon: X, cls: "text-red-600 dark:text-red-400" },
  SETTLED: { icon: CircleDollarSign, cls: "text-emerald-600 dark:text-emerald-400" },
  REIMBURSED: { icon: Banknote, cls: "text-emerald-600 dark:text-emerald-400" },
  NOTE: { icon: MessageSquare, cls: "text-muted-foreground" },
};

export function ClaimTracking({ claim }: { claim: ClaimDetail }) {
  const canWrite = useCanWrite("dms");
  const addComment = useAddClaimComment(claim.id);
  const reimburse = useReimburseClaim(claim.id);
  const [comment, setComment] = useState("");
  const [reimburseOpen, setReimburseOpen] = useState(false);
  const [amount, setAmount] = useState("");

  // Manual reimbursement is only for claims not reconciled via credit notes
  // (those drive reimbursedAmount automatically).
  const canReimburse =
    (claim.status === "APPROVED" || claim.status === "SETTLED") &&
    claim.creditNotes.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Financial summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CircleDollarSign className="size-4 text-muted-foreground" />
            Financial summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Claimed" value={fmtMoney(claim.claimAmount)} />
          <Row label="Approved" value={claim.approvedAmount > 0 ? fmtMoney(claim.approvedAmount) : "—"} />
          <Row label="Reimbursed" value={claim.reimbursedAmount > 0 ? fmtMoney(claim.reimbursedAmount) : "—"} />
          <div className="border-t pt-3">
            <Row
              label="Outstanding"
              value={fmtMoney(claim.outstanding)}
              strong
              tone={claim.outstanding > 0 ? "warning" : "positive"}
            />
          </div>
          {claim.expectedReimburseAt && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              Expected by {fmtDateTime(claim.expectedReimburseAt)}
            </p>
          )}
          {canWrite && canReimburse && (
            <Button size="sm" className="w-full" onClick={() => setReimburseOpen(true)}>
              <Banknote className="size-4" />
              Record reimbursement
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tracking timeline + comments */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="size-4 text-muted-foreground" />
            OEM tracking &amp; comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canWrite && (
            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Log a reviewer comment or an internal note…"
                className="min-h-[38px]"
                rows={1}
              />
              <Button
                size="sm"
                disabled={!comment.trim() || addComment.isPending}
                onClick={() =>
                  addComment.mutate(
                    { kind: "COMMENT", note: comment },
                    { onSuccess: () => setComment("") },
                  )
                }
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          )}

          {claim.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="space-y-3">
              {claim.events.map((e) => (
                <TimelineRow key={e.id} event={e} />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={reimburseOpen} onOpenChange={setReimburseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record reimbursement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Approved {fmtMoney(claim.approvedAmount)} · outstanding{" "}
              {fmtMoney(claim.outstanding)}
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount received"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!amount || Number(amount) <= 0 || reimburse.isPending}
              onClick={() =>
                reimburse.mutate(Number(amount), {
                  onSuccess: () => {
                    setReimburseOpen(false);
                    setAmount("");
                  },
                })
              }
            >
              {reimburse.isPending ? "Saving…" : "Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  tone?: "warning" | "positive";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong && "font-semibold",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineRow({ event }: { event: ClaimEvent }) {
  const ui = EVENT_UI[event.kind];
  const Icon = ui.icon;
  return (
    <li className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted/40",
          ui.cls,
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {event.note ?? event.kind}
          {event.kind === "SUBMITTED" && (
            <Sparkles className="ml-1 inline size-3 text-muted-foreground" />
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {event.by ? `${event.by} · ` : ""}
          {fmtDateTime(event.at)}
        </p>
      </div>
    </li>
  );
}
