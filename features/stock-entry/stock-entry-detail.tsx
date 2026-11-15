"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { fmtMoney, fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import { PURPOSE_LABELS } from "./schema";
import {
  useCancelStockEntry,
  useDeleteStockEntry,
  useStockEntry,
  useSubmitStockEntry,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function StockEntryDetail({ entryId }: { entryId: string }) {
  const router = useRouter();
  const { data: e, isLoading } = useStockEntry(entryId);
  const submit = useSubmitStockEntry();
  const cancel = useCancelStockEntry();
  const del = useDeleteStockEntry();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !e) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = e.status === "DRAFT";
  const isSubmitted = e.status === "SUBMITTED";
  const showFinished = e.items.some((it) => it.isFinishedItem);

  return (
    <div className="space-y-6">
      <PageHeader
        title={e.name}
        subtitle={PURPOSE_LABELS[e.purpose]}
        actions={
          <div className="flex items-center gap-2">
            <DocStatusBadge status={e.status} />
            {isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/stock/stock-entry/${e.id}/edit`}>
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
                  onClick={() => submit.mutate(e.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {isSubmitted && (
              <Button
                variant="destructive"
                onClick={() => setConfirm("cancel")}
              >
                Cancel Entry
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label="Source"
            value={
              e.fromWarehouseId ? (
                <Link href={`/stock/warehouses/${e.fromWarehouseId}`} className="text-primary hover:underline">
                  {e.fromWarehouse}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Meta
            label="Target"
            value={
              e.toWarehouseId ? (
                <Link href={`/stock/warehouses/${e.toWarehouseId}`} className="text-primary hover:underline">
                  {e.toWarehouse}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Meta label="Posted" value={fmtDateTime(e.postingAt)} />
          <Meta label="Net Value" value={fmtMoney(e.valueDifference)} />
          {e.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Remarks" value={e.remarks} />
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
                <th className="p-3 text-right font-medium">Valuation</th>
                <th className="p-3 text-right font-medium">Amount</th>
                {showFinished && (
                  <th className="p-3 text-center font-medium">Finished</th>
                )}
              </tr>
            </thead>
            <tbody>
              {e.items.map((it) => (
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
                    {fmtRate(it.basicRate)}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">
                    {it.valuationRate ? fmtRate(it.valuationRate) : "—"}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(it.amount)}
                  </td>
                  {showFinished && (
                    <td className="p-3 text-center">
                      <Checkbox checked={it.isFinishedItem} disabled />
                    </td>
                  )}
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
              {confirm === "delete"
                ? `Delete ${e.name}?`
                : `Cancel ${e.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft entry."
                : "This reverses the posted stock ledger entries. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(e.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/stock/stock-entry");
                    },
                  });
                } else {
                  cancel.mutate(e.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
