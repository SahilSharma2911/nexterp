"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgeIndianRupee,
  Banknote,
  Calendar,
  Car,
  Check,
  FileText,
  Pencil,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
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
    disburse.isPending ||
    reject.isPending;

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
    <div className="space-y-4">
      <DetailHeader
        icon={BadgeIndianRupee}
        title={c.name}
        titleMono
        subtitle={`${c.customerName} · ${c.vehicle}`}
        badge={<SubsidyStatusBadge status={c.status} />}
        stats={[{ label: "Amount", value: fmtMoney(c.claimAmount) }]}
        actions={
          <>
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dms/subsidy-claims/${c.id}/edit`}>
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
                <Button
                  size="sm"
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
              <Button size="sm" disabled={busy} onClick={() => disburse.mutate(c.id)}>
                {disburse.isPending ? "…" : "Mark Disbursed"}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeIndianRupee className="size-4 text-muted-foreground" />
            Claim details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            icon={Banknote}
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
          <Field icon={User} label="Customer" value={c.customerName} />
          <Field
            icon={Banknote}
            label="Claim amount"
            value={fmtMoney(c.claimAmount)}
          />
          <Field
            icon={Calendar}
            label="Disbursed"
            value={c.disbursedAt ? fmtDateTime(c.disbursedAt) : dash}
          />
          {c.remarks && (
            <Field
              icon={FileText}
              label="Remarks"
              value={c.remarks}
              className="sm:col-span-2 lg:col-span-3"
            />
          )}
          {c.kycDocUrl && (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <ShieldCheck className="size-3.5" />
                KYC document
              </p>
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
