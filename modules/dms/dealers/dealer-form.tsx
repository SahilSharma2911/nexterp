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
  dealerFormSchema,
  emptyDealer,
  type DealerFormValues,
} from "./schema";
import { useCreateDealer, useDealer, useUpdateDealer } from "./queries";

type FieldName = Exclude<keyof DealerFormValues, "disabled">;

function TextField({
  form,
  name,
  label,
  placeholder,
  className,
  type,
}: {
  form: ReturnType<typeof useForm<DealerFormValues>>;
  name: FieldName;
  label: string;
  placeholder?: string;
  className?: string;
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

export function DealerForm({ dealerId }: { dealerId?: string }) {
  const router = useRouter();
  const isEdit = !!dealerId;
  const { data: existing, isLoading } = useDealer(dealerId);
  const create = useCreateDealer();
  const update = useUpdateDealer();

  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: emptyDealer,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        code: existing.code,
        name: existing.name,
        legalName: existing.legalName ?? "",
        contactPerson: existing.contactPerson ?? "",
        phone: existing.phone ?? "",
        email: existing.email ?? "",
        gstin: existing.gstin ?? "",
        addressLine1: existing.addressLine1 ?? "",
        addressLine2: existing.addressLine2 ?? "",
        city: existing.city ?? "",
        state: existing.state ?? "",
        country: existing.country ?? "",
        postalCode: existing.postalCode ?? "",
        disabled: existing.disabled,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: DealerFormValues) {
    const done = () => router.push("/dms/dealers");
    if (isEdit && dealerId) {
      update.mutate({ id: dealerId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Dealership</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField form={form} name="code" label="Dealer Code" placeholder="DLR-001" />
            <TextField form={form} name="name" label="Name" placeholder="Metro EV Motors" />
            <TextField form={form} name="legalName" label="Legal Name" />
            <TextField form={form} name="gstin" label="GSTIN / Tax ID" />
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
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField form={form} name="contactPerson" label="Contact Person" />
            <TextField form={form} name="phone" label="Phone" type="tel" />
            <TextField form={form} name="email" label="Email" type="email" placeholder="dealer@example.com" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField form={form} name="addressLine1" label="Address Line 1" className="sm:col-span-2 lg:col-span-3" />
            <TextField form={form} name="addressLine2" label="Address Line 2" className="sm:col-span-2 lg:col-span-3" />
            <TextField form={form} name="city" label="City" />
            <TextField form={form} name="state" label="State / Province" />
            <TextField form={form} name="postalCode" label="Postal Code" />
            <TextField form={form} name="country" label="Country" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create dealer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
