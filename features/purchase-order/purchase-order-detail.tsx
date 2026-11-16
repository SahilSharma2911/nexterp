"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Truck } from "lucide-react";
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
import { OrderStatusBadge } from "@/components/order-status-badge";
import { useCanWrite } from "@/components/session-context";
import { fmtMoney, fmtQty, fmtRate } from "@/lib/format";
import {
  usePurchaseOrder,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder,
  useSubmitPurchaseOrder,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function PurchaseOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: po, isLoading } = usePurchaseOrder(orderId);
  const submit = useSubmitPurchaseOrder();
  const cancel = useCancelPurchaseOrder();
  const del = useDeletePurchaseOrder();
  const canWrite = useCanWrite("buying");
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !po) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = po.status === "DRAFT";
  const isOpen = po.status === "TO_FULFILL";

  return (
    <div className="space-y-6">
      <PageHeader
        title={po.name}
        subtitle={po.supplier}
        actions={
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={po.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/buying/purchase-order/${po.id}/edit`}>
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
                  onClick={() => submit.mutate(po.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isOpen && (
              <>
                <Button asChild>
                  <Link href={`/buying/purchase-receipt/new?po=${po.id}`}>
                    <Truck className="size-4" />
                    Create Receipt
                  </Link>
                </Button>
                <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Supplier" value={po.supplier} />
          <Meta label="Warehouse" value={po.warehouse} />
          <Meta label="Total Qty" value={fmtQty(po.totalQty)} />
          <Meta label="Total Amount" value={fmtMoney(po.totalAmount)} />
          {po.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Remarks" value={po.remarks} />
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
                <th className="p-3 text-right font-medium">Received</th>
                <th className="p-3 text-right font-medium">Rate</th>
                <th className="p-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="font-mono text-xs font-medium">
                      {it.itemCode}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {it.itemName}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{fmtQty(it.qty)}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">
                    {fmtQty(it.receivedQty)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtRate(it.rate)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(it.amount)}
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
              {confirm === "delete" ? `Delete ${po.name}?` : `Cancel ${po.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft order."
                : "This releases the ordered quantities. Received goods must be reversed first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(po.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/buying/purchase-order");
                    },
                  });
                } else {
                  cancel.mutate(po.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
