"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { emptyItem, itemFormSchema, type ItemFormValues } from "./schema";
import { useCreateItem, useItem, useUpdateItem } from "./queries";

export function ItemFormDialog({
  open,
  onOpenChange,
  itemId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
}) {
  const isEdit = !!itemId;
  const { data: existing, isLoading } = useItem(
    open && itemId ? itemId : undefined,
  );
  const create = useCreateItem();
  const update = useUpdateItem();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: emptyItem,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      form.reset({
        itemCode: existing.itemCode,
        itemName: existing.itemName,
        description: existing.description ?? "",
        itemGroup: existing.itemGroup ?? "",
        stockUom: existing.stockUom,
        isStockItem: existing.isStockItem,
        hasSerialNo: existing.hasSerialNo,
        hasBatchNo: existing.hasBatchNo,
        valuationRate: existing.valuationRate,
        disabled: existing.disabled,
      });
    } else if (!isEdit) {
      form.reset(emptyItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: ItemFormValues) {
    if (isEdit && itemId) {
      update.mutate(
        { id: itemId, values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "New Item"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this item master record."
              : "Add a new item to the catalogue."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Code</FormLabel>
                      <FormControl>
                        <Input placeholder="WHEEL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockUom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UOM</FormLabel>
                      <FormControl>
                        <Input placeholder="Nos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Rubber Wheel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <FormControl>
                        <Input placeholder="Raw Material" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valuationRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valuation Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Optional notes…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-6 rounded-lg border bg-muted/30 p-3">
                <FormField
                  control={form.control}
                  name="isStockItem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Stock Item</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="disabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Disabled</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Saving…"
                    : isEdit
                      ? "Save changes"
                      : "Create item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
