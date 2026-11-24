"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Pencil, Printer, ScanLine, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Barcode } from "@/components/barcode";
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
import { useCanWrite } from "@/components/session-context";
import { fmtMoney } from "@/lib/format";
import { ItemBatches } from "@/features/batches/item-batches";
import { ItemSerials } from "@/features/serials/item-serials";
import { useDeleteItem, useGenerateVariants, useItem } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function ItemDetail({ itemId }: { itemId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("stock");
  const { data: it, isLoading } = useItem(itemId);
  const del = useDeleteItem();
  const gen = useGenerateVariants();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !it) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={it.itemCode}
        subtitle={it.itemName}
        actions={
          <div className="flex items-center gap-2">
            {it.hasVariants && <Badge variant="outline">Template</Badge>}
            {it.variantOfId && <Badge variant="outline">Variant</Badge>}
            {it.disabled && <Badge variant="secondary">Disabled</Badge>}
            <Button asChild variant="outline">
              <Link href={`/stock/items/${it.id}/label`}>
                <Printer className="size-4" />
                Print labels
              </Link>
            </Button>
            {canWrite && (
              <>
                {it.hasVariants && (
                  <Button
                    variant="outline"
                    disabled={gen.isPending}
                    onClick={() => gen.mutate(it.id)}
                  >
                    <Sparkles className="size-4" />
                    {gen.isPending ? "Generating…" : "Generate Variants"}
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/stock/items/${it.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Unit of Measure" value={it.stockUom} />
          <Meta label="Item Group" value={it.itemGroup ?? "—"} />
          <Meta label="Brand" value={it.brand ?? "—"} />
          <Meta label="Tax / HSN Code" value={it.taxCode ?? "—"} />
          <Meta label="Valuation Rate (cost)" value={fmtMoney(it.valuationRate)} />
          <Meta label="Standard Selling Rate" value={fmtMoney(it.salesRate)} />
          <Meta label="Reorder Level" value={it.reorderLevel || "—"} />
          <Meta label="Maintain Stock" value={it.isStockItem ? "Yes" : "No"} />
          <Meta label="Serial No." value={it.hasSerialNo ? "Yes" : "No"} />
          <Meta label="Batch No." value={it.hasBatchNo ? "Yes" : "No"} />
          {it.variantOfId && (
            <Meta
              label="Variant of"
              value={
                <Link
                  href={`/stock/items/${it.variantOfId}`}
                  className="text-primary hover:underline"
                >
                  {it.variantOfCode} — {it.variantOfName}
                </Link>
              }
            />
          )}
          {it.description && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Meta label="Description" value={it.description} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Every item is scannable: use the custom barcode if set, otherwise
          encode the item code (which is always present & unique). */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScanLine className="size-4 text-muted-foreground" />
            Barcode
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          <Barcode value={it.barcode || it.itemCode} height={64} />
          <p className="text-xs text-muted-foreground">
            Encoded from the item code ({it.barcode || it.itemCode}).
          </p>
        </CardContent>
      </Card>

      {it.specifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {it.specifications.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="w-1/3 p-3 font-medium text-muted-foreground">
                      {s.label}
                    </td>
                    <td className="p-3">{s.value || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {it.hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Variant attributes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {it.variantAttributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attributes defined yet — edit this item to add them.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {it.variantAttributes.map((a, i) => (
                  <div key={i} className="rounded-lg border px-3 py-2 text-sm">
                    <span className="font-medium">{a.attribute}:</span>{" "}
                    <span className="text-muted-foreground">{a.values}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Boxes className="size-4" />
                Variants ({it.variants.length})
              </p>
              {it.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None yet. Use “Generate Variants” to create them.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {it.variants.map((v) => (
                    <Link
                      key={v.id}
                      href={`/stock/items/${v.id}`}
                      className="rounded-md border px-3 py-1.5 font-mono text-xs text-primary hover:bg-accent"
                    >
                      {v.itemCode}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {it.hasBatchNo && <ItemBatches itemId={it.id} />}
      {it.hasSerialNo && <ItemSerials itemId={it.id} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {it.itemCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{it.itemName}”. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(it.id, {
                  onSuccess: () => {
                    setConfirmDelete(false);
                    router.push("/stock/items");
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
