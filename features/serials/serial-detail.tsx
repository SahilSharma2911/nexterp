"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Hash,
  Pencil,
  ScanLine,
  Trash2,
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
import { SerialStatusBadge } from "./columns";
import { useSerial, useDeleteSerial } from "./queries";

const dash = <span className="text-muted-foreground">—</span>;

export function SerialDetail({ serialId }: { serialId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("stock");
  const { data: s, isLoading } = useSerial(serialId);
  const del = useDeleteSerial();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !s) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const code = s.barcode || s.serialNo;

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Hash}
        title={s.serialNo}
        titleMono
        subtitle={`${s.itemCode} · ${s.itemName}`}
        badge={<SerialStatusBadge status={s.status} />}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/stock/serials/${s.id}/edit`}>
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
              <Hash className="size-4 text-muted-foreground" />
              Serial details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={Boxes}
              label="Item"
              value={
                <Link
                  href={`/stock/items/${s.itemId}`}
                  className="text-primary hover:underline"
                >
                  {s.itemCode} · {s.itemName}
                </Link>
              }
            />
            <Field
              icon={Warehouse}
              label="Warehouse"
              value={s.warehouseName ?? dash}
            />
            {s.notes && (
              <Field
                icon={Pencil}
                label="Notes"
                value={s.notes}
                className="sm:col-span-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-4 text-muted-foreground" />
              Serial barcode
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
            <AlertDialogTitle>Delete serial {s.serialNo}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the serial record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(s.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/stock/serials");
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
