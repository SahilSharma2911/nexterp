"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVehicleOptions } from "@/modules/dms/vehicles/queries";
import { useTechnicianOptions } from "@/modules/dms/technicians/queries";
import { useServiceBayOptions } from "@/modules/dms/service-bays/queries";
import {
  appointmentFormSchema,
  emptyAppointment,
  type AppointmentFormValues,
} from "./schema";
import {
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "./queries";

const UNASSIGNED = "__none__";

export function AppointmentForm({
  appointmentId,
}: {
  appointmentId?: string;
}) {
  const router = useRouter();
  const isEdit = !!appointmentId;
  const { data: existing, isLoading } = useAppointment(appointmentId);
  const { data: vehicleOptions = [] } = useVehicleOptions();
  const { data: technicianOptions = [] } = useTechnicianOptions();
  const { data: bayOptions = [] } = useServiceBayOptions();
  const create = useCreateAppointment();
  const update = useUpdateAppointment();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: emptyAppointment,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        vehicleId: existing.vehicleId,
        customerName: existing.customerName ?? "",
        requestedAt: existing.requestedAt
          ? existing.requestedAt.slice(0, 16)
          : "",
        isHV: existing.isHV,
        bayId: existing.bayId ?? "",
        technicianId: existing.technicianId ?? "",
        complaint: existing.complaint ?? "",
        remarks: existing.remarks ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const isHV = useWatch({ control: form.control, name: "isHV" });
  const bays = isHV ? bayOptions.filter((b) => b.isHV) : bayOptions;
  const techs = isHV
    ? technicianOptions.filter((t) => t.isHVCertified)
    : technicianOptions;
  const pending = create.isPending || update.isPending;

  function onSubmit(values: AppointmentFormValues) {
    const done = () => router.push("/dms/service-appointments");
    if (isEdit && appointmentId) {
      update.mutate({ id: appointmentId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Appointment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vehicle…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleOptions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vin} — {v.model}
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
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Customer name"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested date &amp; time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHV"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        // Clear assignments that no longer qualify for HV.
                        if (v) {
                          const bayId = form.getValues("bayId");
                          const techId = form.getValues("technicianId");
                          if (bayId && !bayOptions.find((b) => b.id === bayId)?.isHV)
                            form.setValue("bayId", "");
                          if (
                            techId &&
                            !technicianOptions.find((t) => t.id === techId)
                              ?.isHVCertified
                          )
                            form.setValue("technicianId", "");
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="font-normal">
                      High-voltage work
                    </FormLabel>
                    <FormDescription>
                      Restricts to HV-certified technicians &amp; HV bays.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician</FormLabel>
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
                      {techs.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {t.isHVCertified ? " · HV" : ""}
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
              name="bayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Bay</FormLabel>
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
                      {bays.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          {b.isHV ? " · HV" : ""}
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
              name="complaint"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
                  <FormLabel>Complaint / Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's the service for?"
                      {...field}
                      value={field.value ?? ""}
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
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Internal notes…"
                    />
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
            {pending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Book appointment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
