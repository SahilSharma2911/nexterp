"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { fmtQty, fmtRate } from "@/lib/format";
import { WorkOrderStatusBadge } from "./status-badge";
import {
  useCancelWorkOrder,
  useFinishWorkOrder,
  useWorkOrder,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function WorkOrderDetail({ workOrderId }: { workOrderId: string }) {
  const { data: w, isLoading } = useWorkOrder(workOrderId);
  const finish = useFinishWorkOrder();
  const cancel = useCancelWorkOrder();
  const [finishOpen, setFinishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [qty, setQty] = useState(0);

  const remaining = w ? Math.round((w.qty - w.producedQty) * 1e6) / 1e6 : 0;

  useEffect(() => {
    if (finishOpen) setQty(remaining);
  }, [finishOpen, remaining]);

  if (isLoading || !w) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const canProduce = w.status !== "COMPLETED" && w.status !== "CANCELLED";
  const canCancel = w.producedQty === 0 && w.status !== "CANCELLED";
  const pct = w.qty > 0 ? Math.min(100, (w.producedQty / w.qty) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={w.name}
        subtitle={`${w.itemCode} — ${w.itemName}`}
        actions={
          <div className="flex items-center gap-2">
            <WorkOrderStatusBadge status={w.status} />
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
            {canProduce && (
              <Button onClick={() => setFinishOpen(true)}>
                Finish production
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="BOM" value={w.bomName} />
            <Meta
              label="Produced"
              value={`${fmtQty(w.producedQty)} / ${fmtQty(w.qty)} ${w.uom}`}
            />
            <Meta label="Source" value={w.sourceWarehouse ?? "—"} />
            <Meta label="Finished Goods" value={w.fgWarehouse ?? "—"} />
            {w.remarks && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Meta label="Remarks" value={w.remarks} />
              </div>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Required Materials</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 text-right font-medium">Required</th>
                <th className="p-3 text-right font-medium">Consumed</th>
                <th className="p-3 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {w.items.map((it) => (
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
                    {fmtQty(it.requiredQty)}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">
                    {fmtQty(it.consumedQty)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtRate(it.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {w.stockEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Manufacturing Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {w.stockEntries.map((se) => (
                <li
                  key={se.id}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <Link
                    href={`/stock/stock-entry/${se.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {se.name}
                  </Link>
                  <span className="text-muted-foreground">{se.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Finish production</DialogTitle>
            <DialogDescription>
              Posts a manufacturing stock entry: consumes materials and receives
              finished goods. {fmtQty(remaining)} {w.uom} remaining.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="finish-qty">Quantity to produce now</Label>
            <Input
              id="finish-qty"
              type="number"
              step="0.001"
              min="0"
              max={remaining}
              value={qty}
              onChange={(e) =>
                setQty(e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={finish.isPending || !(qty > 0) || qty > remaining + 1e-6}
              onClick={() =>
                finish.mutate(
                  { id: w.id, qty },
                  { onSuccess: () => setFinishOpen(false) },
                )
              }
            >
              {finish.isPending ? "Posting…" : "Produce"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {w.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the work order cancelled. Only allowed before any units
              are produced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                cancel.mutate(w.id, { onSuccess: () => setCancelOpen(false) });
              }}
            >
              Cancel Work Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
