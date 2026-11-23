"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Car,
  Check,
  CircleDollarSign,
  FileText,
  FileWarning,
  Hash,
  Landmark,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DetailHeader, Field } from "@/components/detail/detail-shell";
import { useCanWrite } from "@/components/session-context";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { ClaimStatusBadge } from "./columns";
import { EligibilityPanel } from "./eligibility-panel";
import {
  useApproveClaim,
  useCancelClaim,
  useClaim,
  useDeleteClaim,
  useRejectClaim,
  useSettleClaim,
  useSubmitClaim,
} from "./queries";

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
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
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

  const confirmCopy: Record<
    Exclude<Confirm, null>,
    { title: string; body: string; action: string }
  > = {
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
    <div className="space-y-4">
      <DetailHeader
        icon={FileWarning}
        title={c.name}
        titleMono
        subtitle={`${c.vehicle} · ${c.component}`}
        badge={<ClaimStatusBadge status={c.status} />}
        stats={[{ label: "Claim", value: fmtMoney(c.claimAmount) }]}
        actions={
          <>
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dms/warranty-claims/${c.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                <Button size="sm" disabled={busy} onClick={() => submit.mutate(c.id)}>
                  <Send className="size-4" />
                  {submit.isPending ? "Submitting…" : "Submit to OEM"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm("reject")}
                >
                  <X className="size-4" />
                  Reject
                </Button>
                <Button size="sm" disabled={busy} onClick={() => approve.mutate(c.id)}>
                  <Check className="size-4" />
                  {approve.isPending ? "Approving…" : "Approve"}
                </Button>
              </>
            )}
            {canWrite && isApproved && (
              <Button size="sm" disabled={busy} onClick={() => settle.mutate(c.id)}>
                {settle.isPending ? "Settling…" : "Mark Settled"}
              </Button>
            )}
            {canWrite && (isDraft || isSubmitted) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirm("cancel")}
              >
                Cancel Claim
              </Button>
            )}
          </>
        }
      />

      <EligibilityPanel claimId={c.id} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="size-4 text-muted-foreground" />
            Claim details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            icon={ShieldCheck}
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
          <Field
            icon={Car}
            label="Vehicle"
            value={
              <Link
                href={`/dms/vehicles/${c.vehicleId}`}
                className="font-mono text-primary hover:underline"
              >
                {c.vehicle}
              </Link>
            }
          />
          <Field
            icon={Wrench}
            label="Job card"
            value={
              c.jobCardId && c.jobCard ? (
                <Link
                  href={`/dms/job-cards/${c.jobCardId}`}
                  className="font-mono text-primary hover:underline"
                >
                  {c.jobCard}
                </Link>
              ) : (
                dash
              )
            }
          />
          <Field
            icon={Calendar}
            label="Claim date"
            value={fmtDateTime(c.claimDate)}
          />
          <Field
            icon={CircleDollarSign}
            label="Claim amount"
            value={fmtMoney(c.claimAmount)}
          />
          <Field
            icon={Landmark}
            label="Approved amount"
            value={c.approvedAmount > 0 ? fmtMoney(c.approvedAmount) : dash}
          />
          <Field icon={Hash} label="OEM ref" value={c.oemRef ?? dash} />
          <Field icon={FileWarning} label="Fault code" value={c.faultCode ?? dash} />
          {c.description && (
            <Field
              icon={FileText}
              label="Description"
              value={c.description}
              className="sm:col-span-2 lg:col-span-4"
            />
          )}
          {c.remarks && (
            <Field
              icon={FileText}
              label="Remarks"
              value={c.remarks}
              className="sm:col-span-2 lg:col-span-4"
            />
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
