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
  emptyWarehouse,
  warehouseFormSchema,
  type WarehouseFormValues,
} from "./schema";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from "./queries";

export function WarehouseForm({ warehouseId }: { warehouseId?: string }) {
  const router = useRouter();
  const isEdit = !!warehouseId;
  const { data: existing, isLoading } = useWarehouse(warehouseId);
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: emptyWarehouse,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        warehouseName: existing.warehouseName,
        warehouseType: existing.warehouseType ?? "",
        disabled: existing.disabled,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: WarehouseFormValues) {
    const done = () => router.push("/stock/warehouses");
    if (isEdit && warehouseId) {
      update.mutate({ id: warehouseId, values }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  }

  if (isEdit && isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-lg border bg-muted/30 p-3 sm:col-span-2">
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create warehouse"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
