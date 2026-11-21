"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  CalendarClock,
  Factory,
  Layers,
  Pencil,
  ScanLine,
  Trash2,
  Truck,
  Warehouse,
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
import { Barcode } from "@/components/barcode";
import { useCanWrite } from "@/components/session-context";
import { fmtQty } from "@/lib/format";
import { ExpiryBadge, fmtDate } from "./columns";
import { useBatch, useDeleteBatch } from "./queries";

const dash = <span className="text-muted-foreground">—</span>;

export function BatchDetail({ batchId }: { batchId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("stock");
  const { data: b, isLoading } = useBatch(batchId);
  const del = useDeleteBatch();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const code = b.barcode || b.batchNo;

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Layers}
        title={b.batchNo}
        titleMono
        subtitle={`${b.itemCode} · ${b.itemName}`}
        badge={<ExpiryBadge status={b.expiry} days={b.daysToExpiry} />}
        stats={[{ label: "On hand", value: fmtQty(b.onHand) }]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/stock/batches/${b.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              Batch details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={Boxes}
              label="Item"
              value={
                <Link
                  href={`/stock/items/${b.itemId}`}
                  className="text-primary hover:underline"
                >
                  {b.itemCode} · {b.itemName}
                </Link>
              }
            />
            <Field
              icon={Boxes}
              label="On hand"
              value={`${fmtQty(b.onHand)} (received ${fmtQty(b.qty)})`}
            />
            <Field
              icon={Warehouse}
              label="Warehouse"
              value={b.warehouseName ?? dash}
            />
            <Field
              icon={Factory}
              label="Manufactured"
              value={b.mfgDate ? fmtDate(b.mfgDate) : dash}
            />
            <Field
              icon={CalendarClock}
              label="Expiry"
              value={b.expiryDate ? fmtDate(b.expiryDate) : dash}
            />
            <Field icon={Truck} label="Supplier" value={b.supplier ?? dash} />
            {b.notes && (
              <Field
                icon={Pencil}
                label="Notes"
                value={b.notes}
                className="sm:col-span-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-4 text-muted-foreground" />
              Batch barcode
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <Barcode value={code} />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete batch {b.batchNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the batch record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(b.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/stock/batches");
                  },
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
