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
  emptyCustomer,
  customerFormSchema,
  type CustomerFormValues,
} from "./schema";
import { useCreateCustomer, useCustomer, useUpdateCustomer } from "./queries";

export function CustomerFormDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
}) {
  const isEdit = !!customerId;
  const { data: existing, isLoading } = useCustomer(
    open && customerId ? customerId : undefined,
  );
  const create = useCreateCustomer();
  const update = useUpdateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: emptyCustomer,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && existing) {
      form.reset({
        customerName: existing.customerName,
        customerGroup: existing.customerGroup ?? "",
        territory: existing.territory ?? "",
        disabled: existing.disabled,
      });
    } else if (!isEdit) {
      form.reset(emptyCustomer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: CustomerFormValues) {
    if (isEdit && customerId) {
      update.mutate(
        { id: customerId, values },
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
          <DialogTitle>{isEdit ? "Edit Customer" : "New Customer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this customer." : "Add a customer."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Zenith Retail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <FormControl>
                        <Input placeholder="Retail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="territory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Territory</FormLabel>
                      <FormControl>
                        <Input placeholder="North" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                      : "Create customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
