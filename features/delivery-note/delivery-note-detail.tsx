"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
  useDeliveryNote,
  useCancelDeliveryNote,
  useDeleteDeliveryNote,
  useSubmitDeliveryNote,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function DeliveryNoteDetail({ noteId }: { noteId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("selling");
  const { data: dn, isLoading } = useDeliveryNote(noteId);
  const submit = useSubmitDeliveryNote();
  const cancel = useCancelDeliveryNote();
  const del = useDeleteDeliveryNote();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !dn) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = dn.status === "DRAFT";
  const isSubmitted = dn.status === "SUBMITTED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={dn.name}
        subtitle={dn.customer}
        actions={
          <div className="flex items-center gap-2">
            <DocStatusBadge status={dn.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/selling/delivery-note/${dn.id}/edit`}>
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
                  onClick={() => submit.mutate(dn.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Note
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Meta label="Customer" value={dn.customer} />
          <Meta label="Warehouse" value={dn.warehouse} />
          <Meta label="Posted" value={fmtDateTime(dn.postingAt)} />
          <Meta label="Sales Value" value={fmtMoney(dn.totalAmount)} />
          <Meta label="COGS" value={fmtMoney(dn.totalCogs)} />
          {dn.remarks && (
            <div className="sm:col-span-2 lg:col-span-5">
              <Meta label="Remarks" value={dn.remarks} />
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
                <th className="p-3 text-right font-medium">COGS Rate</th>
              </tr>
            </thead>
            <tbody>
              {dn.items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="font-mono text-xs font-medium">
                      {it.itemCode}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {it.itemName}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtQty(it.qty)} {it.uom}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtRate(it.rate)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(it.amount)}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">
                    {it.valuationRate ? fmtRate(it.valuationRate) : "—"}
                  </td>
                </tr>
              ))}
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
              {confirm === "delete" ? `Delete ${dn.name}?` : `Cancel ${dn.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft delivery note."
                : "This returns the delivered stock and reverses any linked order fulfilment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(dn.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/selling/delivery-note");
                    },
                  });
                } else {
                  cancel.mutate(dn.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
