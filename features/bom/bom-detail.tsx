"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Factory, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useCanWrite } from "@/components/session-context";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { fmtMoney, fmtQty, fmtRate } from "@/lib/format";
import {
  useBom,
  useCancelBom,
  useDeleteBom,
  useSubmitBom,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function BomDetail({ bomId }: { bomId: string }) {
  const canWrite = useCanWrite("manufacturing");
  const router = useRouter();
  const { data: b, isLoading } = useBom(bomId);
  const submit = useSubmitBom();
  const cancel = useCancelBom();
  const del = useDeleteBom();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = b.status === "DRAFT";
  const isSubmitted = b.status === "SUBMITTED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={b.name}
        subtitle={`${b.itemCode} — ${b.itemName}`}
        actions={
          <div className="flex items-center gap-2">
            {b.isDefault && <Badge variant="outline">Default</Badge>}
            <DocStatusBadge status={b.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/manufacturing/bom/${b.id}/edit`}>
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
                  onClick={() => submit.mutate(b.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {isSubmitted && b.isActive && canWrite && (
              <Button asChild>
                <Link href={`/manufacturing/work-order/new?bom=${b.id}`}>
                  <Factory className="size-4" />
                  Create Work Order
                </Link>
              </Button>
            )}
            {canWrite && isSubmitted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel BOM
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label="Finished Item"
            value={
              <Link href={`/stock/items/${b.itemId}`} className="text-primary hover:underline">
                {b.itemCode} — {b.itemName}
              </Link>
            }
          />
          <Meta label="Quantity" value={`${fmtQty(b.quantity)} ${b.uom}`} />
          <Meta label="Total Cost" value={fmtMoney(b.totalCost)} />
          <Meta label="Active" value={b.isActive ? "Yes" : "No"} />
          {b.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Remarks" value={b.remarks} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Components</CardTitle>
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
              {b.items.map((it) => (
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
                    {fmtQty(it.qty)} {it.uom}
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

      {b.explosionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Exploded Raw Materials
            </CardTitle>
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
                {b.explosionItems.map((it) => (
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
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete" ? `Delete ${b.name}?` : `Cancel ${b.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft BOM."
                : "This deactivates the BOM. Open work orders must be closed first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(b.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/manufacturing/bom");
                    },
                  });
                } else {
                  cancel.mutate(b.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel BOM"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
