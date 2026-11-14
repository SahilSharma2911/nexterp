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
  emptySupplier,
  supplierFormSchema,
  type SupplierFormValues,
} from "./schema";
import { useCreateSupplier, useSupplier, useUpdateSupplier } from "./queries";

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplierId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
}) {
  const isEdit = !!supplierId;
  const { data: existing, isLoading } = useSupplier(
    open && supplierId ? supplierId : undefined,
  );
  const create = useCreateSupplier();
  const update = useUpdateSupplier();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: emptySupplier,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      form.reset({
        supplierName: existing.supplierName,
        supplierGroup: existing.supplierGroup ?? "",
        disabled: existing.disabled,
      });
    } else if (!isEdit) {
      form.reset(emptySupplier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: SupplierFormValues) {
    if (isEdit && supplierId) {
      update.mutate(
        { id: supplierId, values },
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
          <DialogTitle>{isEdit ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this supplier." : "Add a supplier."}
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
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Components" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <FormControl>
                      <Input placeholder="Local / Import…" {...field} />
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
                      : "Create supplier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
