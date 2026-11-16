"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import {
  useReconciliation,
  useCancelReconciliation,
  useDeleteReconciliation,
  useSubmitReconciliation,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function ReconciliationDetail({ reconId }: { reconId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("stock");
  const { data: r, isLoading } = useReconciliation(reconId);
  const submit = useSubmitReconciliation();
  const cancel = useCancelReconciliation();
  const del = useDeleteReconciliation();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !r) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isDraft = r.status === "DRAFT";
  const isSubmitted = r.status === "SUBMITTED";
  const showDiff = r.status !== "DRAFT";

  return (
    <div className="space-y-6">
      <PageHeader
        title={r.name}
        subtitle="Stock Reconciliation"
        actions={
          <div className="flex items-center gap-2">
            <DocStatusBadge status={r.status} />
            {canWrite && isDraft && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/stock/reconciliation/${r.id}/edit`}>
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
                  onClick={() => submit.mutate(r.id)}
                >
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
              </>
            )}
            {canWrite && isSubmitted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Entry
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Posted" value={fmtDateTime(r.postingAt)} />
          <Meta label="Rows" value={r.items.length} />
          <div className="sm:col-span-2 lg:col-span-2">
            <Meta label="Remarks" value={r.remarks ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Counted stock</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 font-medium">Warehouse</th>
                <th className="p-3 text-right font-medium">Counted</th>
                {showDiff && (
                  <>
                    <th className="p-3 text-right font-medium">Was</th>
                    <th className="p-3 text-right font-medium">Difference</th>
                  </>
                )}
                <th className="p-3 text-right font-medium">Val. Rate</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/stock/items/${it.itemId}`}
                      className="font-mono text-xs font-medium text-primary hover:underline"
                    >
                      {it.itemCode}
                    </Link>
                    <span className="ml-2 text-muted-foreground">{it.itemName}</span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/stock/warehouses/${it.warehouseId}`}
                      className="text-primary hover:underline"
                    >
                      {it.warehouse}
                    </Link>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtQty(it.qty)} {it.uom}
                  </td>
                  {showDiff && (
                    <>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">
                        {fmtQty(it.currentQty)}
                      </td>
                      <td
                        className={cn(
                          "p-3 text-right font-medium tabular-nums",
                          (it.diff ?? 0) > 0 && "text-emerald-600 dark:text-emerald-400",
                          (it.diff ?? 0) < 0 && "text-red-600 dark:text-red-400",
                        )}
                      >
                        {it.diff == null || it.diff === 0
                          ? "—"
                          : it.diff > 0
                            ? `+${fmtQty(it.diff)}`
                            : fmtQty(it.diff)}
                      </td>
                    </>
                  )}
                  <td className="p-3 text-right tabular-nums">
                    {fmtRate(it.valuationRate)}
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
              {confirm === "delete" ? `Delete ${r.name}?` : `Cancel ${r.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "This permanently deletes the draft reconciliation."
                : "This restores each bin to its pre-reconciliation snapshot."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(r.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/stock/reconciliation");
                    },
                  });
                } else {
                  cancel.mutate(r.id, { onSuccess: () => setConfirm(null) });
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
