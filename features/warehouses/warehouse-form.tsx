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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyWarehouse,
  warehouseFormSchema,
  type WarehouseFormValues,
} from "./schema";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from "./queries";

export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string | null;
}) {
  const isEdit = !!warehouseId;
  const { data: existing, isLoading } = useWarehouse(
    open && warehouseId ? warehouseId : undefined,
  );
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: emptyWarehouse,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      form.reset({
        warehouseName: existing.warehouseName,
        warehouseType: existing.warehouseType ?? "",
        disabled: existing.disabled,
      });
    } else if (!isEdit) {
      form.reset(emptyWarehouse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: WarehouseFormValues) {
    if (isEdit && warehouseId) {
      update.mutate(
        { id: warehouseId, values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Warehouse" : "New Warehouse"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this warehouse."
              : "Add a stock location."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="warehouseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Stores" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warehouseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Transit / Finished Goods…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-lg border bg-muted/30 p-3">
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
                      : "Create warehouse"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
