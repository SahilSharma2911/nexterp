"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyCustomer,
  customerFormSchema,
  type CustomerFormValues,
} from "./schema";
import { useCreateCustomer, useCustomer, useUpdateCustomer } from "./queries";

export function CustomerForm({ customerId }: { customerId?: string }) {
  const router = useRouter();
  const isEdit = !!customerId;
  const { data: existing, isLoading } = useCustomer(customerId);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: emptyCustomer,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        customerName: existing.customerName,
        customerGroup: existing.customerGroup ?? "",
        territory: existing.territory ?? "",
        disabled: existing.disabled,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: CustomerFormValues) {
    const done = () => router.push("/selling/customers");
    if (isEdit && customerId) {
      update.mutate({ id: customerId, values }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  }

  if (isEdit && isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className="lg:col-span-1">
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Zenith Retail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <FormControl>
                    <Input placeholder="Retail / Wholesale…" {...field} />
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
                    <Input placeholder="North / East…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-lg border bg-muted/30 p-3 sm:col-span-2 lg:col-span-3">
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
