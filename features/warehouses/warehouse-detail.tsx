"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { useDeleteWarehouse, useWarehouse } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function WarehouseDetail({ warehouseId }: { warehouseId: string }) {
  const router = useRouter();
  const { data: w, isLoading } = useWarehouse(warehouseId);
  const del = useDeleteWarehouse();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !w) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const addressLines = [w.addressLine1, w.addressLine2].filter(Boolean);
  const locality = [w.city, w.state, w.postalCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={w.warehouseName}
        subtitle={w.warehouseType ?? "Warehouse"}
        actions={
          <div className="flex items-center gap-2">
            {w.disabled ? (
              <Badge variant="secondary">Disabled</Badge>
            ) : (
              <Badge>Active</Badge>
            )}
            <Button asChild variant="outline">
              <Link href={`/stock/warehouses/${w.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta
            label="Street"
            value={addressLines.length ? addressLines.join(", ") : "—"}
          />
          <Meta label="City / State / Postal" value={locality || "—"} />
          <Meta label="Country" value={w.country ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Meta label="Contact Person" value={w.contactPerson ?? "—"} />
          <Meta
            label="Phone"
            value={
              w.phone ? (
                <a href={`tel:${w.phone}`} className="text-primary hover:underline">
                  {w.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <Meta
            label="Email"
            value={
              w.email ? (
                <a
                  href={`mailto:${w.email}`}
                  className="text-primary hover:underline"
                >
                  {w.email}
                </a>
              ) : (
                "—"
              )
            }
          />
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {w.warehouseName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the warehouse. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(w.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/stock/warehouses");
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
