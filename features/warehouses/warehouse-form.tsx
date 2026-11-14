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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyWarehouse,
  warehouseFormSchema,
  WAREHOUSE_TYPES,
  type WarehouseFormValues,
} from "./schema";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from "./queries";

type FieldName = keyof WarehouseFormValues;

function TextField({
  form,
  name,
  label,
  placeholder,
  className,
  list,
  type,
}: {
  form: ReturnType<typeof useForm<WarehouseFormValues>>;
  name: Exclude<FieldName, "disabled">;
  label: string;
  placeholder?: string;
  className?: string;
  list?: string;
  type?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              list={list}
              type={type}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

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
        addressLine1: existing.addressLine1 ?? "",
        addressLine2: existing.addressLine2 ?? "",
        city: existing.city ?? "",
        state: existing.state ?? "",
        country: existing.country ?? "",
        postalCode: existing.postalCode ?? "",
        phone: existing.phone ?? "",
        email: existing.email ?? "",
        contactPerson: existing.contactPerson ?? "",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              form={form}
              name="warehouseName"
              label="Warehouse Name"
              placeholder="Main Store"
            />
            <TextField
              form={form}
              name="warehouseType"
              label="Type"
              placeholder="Stores"
              list="warehouse-types"
            />
            <datalist id="warehouse-types">
              {WAREHOUSE_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              form={form}
              name="addressLine1"
              label="Address Line 1"
              className="sm:col-span-2 lg:col-span-3"
            />
            <TextField
              form={form}
              name="addressLine2"
              label="Address Line 2"
              className="sm:col-span-2 lg:col-span-3"
            />
            <TextField form={form} name="city" label="City" />
            <TextField form={form} name="state" label="State / Province" />
            <TextField form={form} name="postalCode" label="Postal Code" />
            <TextField form={form} name="country" label="Country" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField form={form} name="contactPerson" label="Contact Person" />
            <TextField form={form} name="phone" label="Phone" type="tel" />
            <TextField
              form={form}
              name="email"
              label="Email"
              type="email"
              placeholder="store@example.com"
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
