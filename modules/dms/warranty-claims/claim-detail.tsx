"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { ClaimStatusBadge } from "./columns";
import {
  useApproveClaim,
  useCancelClaim,
  useClaim,
  useDeleteClaim,
  useRejectClaim,
  useSettleClaim,
  useSubmitClaim,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

type Confirm = null | "delete" | "reject" | "cancel";

export function ClaimDetail({ claimId }: { claimId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: c, isLoading } = useClaim(claimId);
  const submit = useSubmitClaim();
  const approve = useApproveClaim();
  const reject = useRejectClaim();
  const settle = useSettleClaim();
  const cancel = useCancelClaim();
  const del = useDeleteClaim();
  const [confirm, setConfirm] = useState<Confirm>(null);

  if (isLoading || !c) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const isDraft = c.status === "DRAFT";
  const isSubmitted = c.status === "SUBMITTED";
  const isApproved = c.status === "APPROVED";
  const busy =
    submit.isPending ||
    approve.isPending ||
    reject.isPending ||
    settle.isPending;

  const confirmCopy: Record<Exclude<Confirm, null>, { title: string; body: string; action: string }> = {
    delete: {
      title: `Delete ${c.name}?`,
      body: "This permanently deletes the draft claim.",
      action: "Delete",
    },
    reject: {
      title: `Reject ${c.name}?`,
      body: "Mark this claim as rejected by the OEM. This is final.",
      action: "Reject",
    },
    cancel: {
      title: `Cancel ${c.name}?`,
      body: "Withdraw this claim. This cannot be undone.",
      action: "Cancel Claim",
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.name}
        subtitle={`${c.vehicle} · ${c.component}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ClaimStatusBadge status={c.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/warranty-claims/${c.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                <Button disabled={busy} onClick={() => submit.mutate(c.id)}>
                  <Send className="size-4" />
                  {submit.isPending ? "Submitting…" : "Submit to OEM"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setConfirm("reject")}
                >
                  <X className="size-4" />
                  Reject
                </Button>
                <Button disabled={busy} onClick={() => approve.mutate(c.id)}>
                  <Check className="size-4" />
                  {approve.isPending ? "Approving…" : "Approve"}
                </Button>
              </>
            )}
            {canWrite && isApproved && (
              <Button disabled={busy} onClick={() => settle.mutate(c.id)}>
                {settle.isPending ? "Settling…" : "Mark Settled"}
              </Button>
            )}
            {canWrite && (isDraft || isSubmitted) && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Claim
              </Button>
            )}
          </div>
        }
      />

      {c.eligible != null && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border p-3 text-sm",
            c.eligible
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
          )}
        >
          {c.eligible ? (
            <Check className="mt-0.5 size-4 shrink-0" />
          ) : (
            <X className="mt-0.5 size-4 shrink-0" />
          )}
          <span>
            <span className="font-semibold">
              {c.eligible ? "Eligible" : "Not eligible"}
            </span>
            {c.eligibilityNote ? ` — ${c.eligibilityNote}` : ""}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label="Warranty"
            value={
              <Link
                href={`/dms/warranties/${c.warrantyId}`}
                className="text-primary hover:underline"
              >
                {c.warrantyLabel}
              </Link>
            }
          />
          <Meta
            label="Vehicle"
            value={
              <Link
                href={`/dms/vehicles/${c.vehicleId}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {c.vehicle}
              </Link>
            }
          />
          <Meta
            label="Job Card"
            value={
              c.jobCardId && c.jobCard ? (
                <Link
                  href={`/dms/job-cards/${c.jobCardId}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {c.jobCard}
                </Link>
              ) : (
                dash
              )
            }
          />
          <Meta label="Claim Date" value={fmtDateTime(c.claimDate)} />
          <Meta label="Claim Amount" value={fmtMoney(c.claimAmount)} />
          <Meta
            label="Approved Amount"
            value={c.approvedAmount > 0 ? fmtMoney(c.approvedAmount) : dash}
          />
          <Meta label="OEM Ref" value={c.oemRef ?? dash} />
          {c.description && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Description" value={c.description} />
            </div>
          )}
          {c.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Remarks" value={c.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmCopy[confirm].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmCopy[confirm].body}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Back</AlertDialogCancel>
                <AlertDialogAction
                  disabled={del.isPending || reject.isPending || cancel.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm === "delete")
                      del.mutate(c.id, {
                        onSuccess: () => {
                          setConfirm(null);
                          router.push("/dms/warranty-claims");
                        },
                      });
                    else if (confirm === "reject")
                      reject.mutate(c.id, { onSuccess: () => setConfirm(null) });
                    else
                      cancel.mutate(c.id, { onSuccess: () => setConfirm(null) });
                  }}
                >
                  {confirmCopy[confirm].action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
