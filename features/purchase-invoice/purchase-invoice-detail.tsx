"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Wallet } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { useCanWrite } from "@/components/session-context";
import { fmtMoney, fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import {
  useCancelPurchaseInvoice,
  useDeletePurchaseInvoice,
  usePurchaseInvoice,
  useSubmitPurchaseInvoice,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function PurchaseInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("accounts");
  const { data: pi, isLoading } = usePurchaseInvoice(invoiceId);
  const submit = useSubmitPurchaseInvoice();
  const cancel = useCancelPurchaseInvoice();
  const del = useDeletePurchaseInvoice();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !pi) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = pi.status === "DRAFT";
  const isSubmitted = pi.status === "SUBMITTED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={pi.name}
        subtitle={pi.supplier}
        actions={
          <div className="flex items-center gap-2">
            <DocStatusBadge status={pi.status} />
            {canWrite && isSubmitted && pi.outstanding > 0 && (
              <Button asChild>
                <Link href={`/accounts/payment-entry/new?pi=${pi.id}`}>
                  <Wallet className="size-4" />
                  Pay
                </Link>
              </Button>
            )}
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/accounts/purchase-invoice/${pi.id}/edit`}>
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
                  onClick={() => submit.mutate(pi.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Invoice
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Supplier" value={pi.supplier} />
          <Meta label="Posted" value={fmtDateTime(pi.postingAt)} />
          <Meta
            label="Due Date"
            value={pi.dueDate ? fmtDateTime(pi.dueDate) : "—"}
          />
          <Meta label="Total" value={fmtMoney(pi.total)} />
          <Meta
            label="Outstanding"
            value={
              <span
                className={
                  pi.outstanding > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {fmtMoney(pi.outstanding)}
              </span>
            }
          />
          {pi.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Meta label="Remarks" value={pi.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 text-right font-medium">Qty</th>
                <th className="p-3 text-right font-medium">Rate</th>
                <th className="p-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pi.items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/stock/items/${it.itemId}`}
                      className="font-mono text-xs font-medium text-primary hover:underline"
                    >
                      {it.itemCode}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      {it.itemName}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtQty(it.qty)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtRate(it.rate)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(it.amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-t">
                <td
                  className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground"
                  colSpan={3}
                >
                  Total
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {fmtMoney(pi.total)}
                </td>
              </tr>
            </tbody>
          </table>
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
                ? `Delete ${pi.name}?`
                : `Cancel ${pi.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft invoice."
                : "This reverses the posted ledger entries. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(pi.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/accounts/purchase-invoice");
                    },
                  });
                } else {
                  cancel.mutate(pi.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
