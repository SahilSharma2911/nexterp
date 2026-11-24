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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVehicleOptions } from "@/modules/dms/vehicles/queries";
import {
  COMPONENT_LABELS,
  WARRANTY_COMPONENTS,
  emptyWarranty,
  warrantyFormSchema,
  type WarrantyFormValues,
} from "./schema";
import {
  useCreateWarranty,
  useUpdateWarranty,
  useWarranty,
} from "./queries";

function numChange(onChange: (v: number | null) => void, allowNull = false) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") onChange(allowNull ? null : 0);
    else onChange(Number(e.target.value));
  };
}

export function WarrantyForm({ warrantyId }: { warrantyId?: string }) {
  const router = useRouter();
  const isEdit = !!warrantyId;
  const { data: existing, isLoading } = useWarranty(warrantyId);
  const { data: vehicleOptions = [] } = useVehicleOptions();
  const create = useCreateWarranty();
  const update = useUpdateWarranty();

  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: emptyWarranty,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        vehicleId: existing.vehicleId,
        component: existing.component,
        startDate: existing.startDate ? existing.startDate.slice(0, 10) : "",
        months: existing.months,
        kmLimit: existing.kmLimit,
        soHThreshold: existing.soHThreshold,
        status: existing.status,
        notes: existing.notes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: WarrantyFormValues) {
    const done = () => router.push("/dms/warranties");
    if (isEdit && warrantyId) {
      update.mutate({ id: warrantyId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Coverage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <FormControl>
                    <Combobox
                      options={vehicleOptions.map((v) => ({
                        value: v.id,
                        label: `${v.vin} — ${v.model}`,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select vehicle…"
                      searchPlaceholder="Search VIN / model…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="component"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WARRANTY_COMPONENTS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {COMPONENT_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="VOID">Void</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage (months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={field.value ?? ""}
                      onChange={numChange(field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kmLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Km limit (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      value={field.value ?? ""}
                      onChange={numChange(field.onChange, true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soHThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery SoH threshold (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={field.value ?? ""}
                      onChange={numChange(field.onChange, true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create warranty"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
