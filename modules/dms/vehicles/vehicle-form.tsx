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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWarehouseOptions } from "@/features/warehouses/queries";
import { useDealerOptions } from "@/modules/dms/dealers/queries";
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
  emptyVehicle,
  vehicleFormSchema,
  type VehicleFormValues,
} from "./schema";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "./queries";

const UNASSIGNED = "__none__";

function numChange(onChange: (v: number | null) => void, allowNull = false) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") onChange(allowNull ? null : 0);
    else onChange(Number(e.target.value));
  };
}

export function VehicleForm({ vehicleId }: { vehicleId?: string }) {
  const router = useRouter();
  const isEdit = !!vehicleId;
  const { data: existing, isLoading } = useVehicle(vehicleId);
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const { data: dealerOptions = [] } = useDealerOptions();
  const create = useCreateVehicle();
  const update = useUpdateVehicle();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: emptyVehicle,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        vin: existing.vin,
        model: existing.model,
        variant: existing.variant ?? "",
        color: existing.color ?? "",
        motorSerial: existing.motorSerial ?? "",
        batterySerial: existing.batterySerial ?? "",
        batterySoH: existing.batterySoH,
        status: existing.status,
        mfgDate: existing.mfgDate ? existing.mfgDate.slice(0, 10) : "",
        purchaseRate: existing.purchaseRate,
        sellingRate: existing.sellingRate,
        warehouseId: existing.warehouseId ?? "",
        dealerId: existing.dealerId ?? "",
        remarks: existing.remarks ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: VehicleFormValues) {
    const done = (r: { id: string }) => router.push(`/dms/vehicles/${r.id}`);
    if (isEdit && vehicleId) {
      update.mutate({ id: vehicleId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="MD2A…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="City EV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <FormControl>
                    <Input placeholder="Long Range" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Pearl White" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">EV powertrain</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="motorSerial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motor Serial</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batterySerial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery Serial</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batterySoH"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery SoH (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="100"
                      value={field.value ?? ""}
                      onChange={numChange(field.onChange, true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Commercial</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      {VEHICLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {VEHICLE_STATUS_LABELS[s]}
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
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (warehouse)</FormLabel>
                  <Select
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) =>
                      field.onChange(v === UNASSIGNED ? "" : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                      {warehouseOptions.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.warehouseName}
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
              name="dealerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer</FormLabel>
                  <Select
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) =>
                      field.onChange(v === UNASSIGNED ? "" : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                      {dealerOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
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
              name="mfgDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mfg Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={numChange(field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={numChange(field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional…" {...field} value={field.value ?? ""} />
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
