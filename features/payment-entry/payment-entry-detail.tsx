"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DocStatusBadge } from "@/components/doc-status-badge";
import { useCanWrite } from "@/components/session-context";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import {
  useCancelPaymentEntry,
  useDeletePaymentEntry,
  usePaymentEntry,
  useSubmitPaymentEntry,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function PaymentEntryDetail({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("accounts");
  const { data: pe, isLoading } = usePaymentEntry(paymentId);
  const submit = useSubmitPaymentEntry();
  const cancel = useCancelPaymentEntry();
  const del = useDeletePaymentEntry();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !pe) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isDraft = pe.status === "DRAFT";
  const isSubmitted = pe.status === "SUBMITTED";
  const isReceive = pe.paymentType === "RECEIVE";
  const invoiceHref = pe.salesInvoiceId
    ? `/accounts/sales-invoice/${pe.salesInvoiceId}`
    : pe.purchaseInvoiceId
      ? `/accounts/purchase-invoice/${pe.purchaseInvoiceId}`
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pe.name}
        subtitle={isReceive ? "Receipt from customer" : "Payment to supplier"}
        actions={
          <div className="flex items-center gap-2">
            <DocStatusBadge status={pe.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/accounts/payment-entry/${pe.id}/edit`}>
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
                  disabled={submit.isPending}
                  onClick={() => submit.mutate(pe.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Payment
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label="Type"
            value={
              isReceive ? (
                <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                  Receive
                </Badge>
              ) : (
                <Badge variant="secondary">Pay</Badge>
              )
            }
          />
          <Meta label={isReceive ? "Customer" : "Supplier"} value={pe.party} />
          <Meta label="Cash / Bank" value={pe.account} />
          <Meta label="Amount" value={fmtMoney(pe.amount)} />
          <Meta
            label="Against Invoice"
            value={
              pe.invoice && invoiceHref ? (
                <Link
                  href={invoiceHref}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {pe.invoice}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Meta label="Posted" value={fmtDateTime(pe.postingAt)} />
          {pe.remarks && (
            <div className="sm:col-span-2">
              <Meta label="Remarks" value={pe.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? `Delete ${pe.name}?`
                : `Cancel ${pe.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft payment."
                : "This reverses the posted ledger entries and restores the invoice outstanding. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(pe.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/accounts/payment-entry");
                    },
                  });
                } else {
                  cancel.mutate(pe.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
