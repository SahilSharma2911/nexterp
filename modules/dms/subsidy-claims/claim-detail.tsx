"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Pencil,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
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
import { SubsidyStatusBadge } from "./columns";
import {
  useApproveSubsidyClaim,
  useCancelSubsidyClaim,
  useDeleteSubsidyClaim,
  useDisburseSubsidyClaim,
  useRejectSubsidyClaim,
  useSubsidyClaim,
  useSubmitSubsidyClaim,
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

export function SubsidyClaimDetail({ claimId }: { claimId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: c, isLoading } = useSubsidyClaim(claimId);
  const submit = useSubmitSubsidyClaim();
  const approve = useApproveSubsidyClaim();
  const disburse = useDisburseSubsidyClaim();
  const reject = useRejectSubsidyClaim();
  const cancel = useCancelSubsidyClaim();
  const del = useDeleteSubsidyClaim();
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
    disburse.isPending ||
    reject.isPending;

  const confirmCopy: Record<Exclude<Confirm, null>, { title: string; body: string; action: string }> = {
    delete: {
      title: `Delete ${c.name}?`,
      body: "This permanently deletes the draft claim.",
      action: "Delete",
    },
    reject: {
      title: `Reject ${c.name}?`,
      body: "Mark this claim as rejected by the authority. This is final.",
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
        subtitle={`${c.customerName} · ${c.vehicle}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SubsidyStatusBadge status={c.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/subsidy-claims/${c.id}/edit`}>
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
                <Button
                  disabled={busy || !c.kycVerified}
                  title={c.kycVerified ? undefined : "Verify KYC first"}
                  onClick={() => submit.mutate(c.id)}
                >
                  <Send className="size-4" />
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <>
                <Button variant="outline" onClick={() => setConfirm("reject")}>
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
              <Button disabled={busy} onClick={() => disburse.mutate(c.id)}>
                {disburse.isPending ? "…" : "Mark Disbursed"}
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

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border p-3 text-sm",
          c.kycVerified
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        )}
      >
        {c.kycVerified ? (
          <ShieldCheck className="size-4 shrink-0" />
        ) : (
          <ShieldAlert className="size-4 shrink-0" />
        )}
        <span>
          <span className="font-semibold">
            {c.kycVerified ? "KYC verified" : "KYC pending"}
          </span>
          {c.kycDocType || c.kycRef
            ? ` — ${[c.kycDocType, c.kycRef].filter(Boolean).join(" · ")}`
            : c.kycVerified
              ? ""
              : " — verify before submitting."}
        </span>
      </div>

      {c.kycDocUrl && (
        <a
          href={c.kycDocUrl}
          target="_blank"
          rel="noreferrer"
          className="relative block h-40 w-60 overflow-hidden rounded-lg border bg-muted"
          title="KYC document"
        >
          <Image
            src={c.kycDocUrl}
            alt="KYC document"
            fill
            sizes="240px"
            className="object-cover"
            unoptimized
          />
        </a>
      )}

      {c.voucherNo && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Check className="size-4 shrink-0 text-primary" />
          <span>
            e-Voucher{" "}
            <span className="font-mono font-semibold">{c.voucherNo}</span>
            {c.approvedAt ? ` · approved ${fmtDateTime(c.approvedAt)}` : ""}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label="Scheme"
            value={
              <Link
                href={`/dms/subsidy-schemes/${c.schemeId}`}
                className="text-primary hover:underline"
              >
                {c.scheme}
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
          <Meta label="Customer" value={c.customerName} />
          <Meta label="Claim Amount" value={fmtMoney(c.claimAmount)} />
          <Meta
            label="Disbursed"
            value={c.disbursedAt ? fmtDateTime(c.disbursedAt) : dash}
          />
          {c.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
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
                          router.push("/dms/subsidy-claims");
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
