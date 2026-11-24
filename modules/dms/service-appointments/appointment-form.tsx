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
import { Combobox } from "@/components/ui/combobox";
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
                  <FormControl>
                    <Combobox
                      options={[
                        { value: "", label: "— Unassigned —" },
                        ...techs.map((t) => ({
                          value: t.id,
                          label: `${t.name}${t.isHVCertified ? " · HV" : ""}`,
                        })),
                      ]}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="— Unassigned —"
                      searchPlaceholder="Search technicians…"
                    />
                  </FormControl>
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
                  <FormControl>
                    <Combobox
                      options={[
                        { value: "", label: "— Unassigned —" },
                        ...bays.map((b) => ({
                          value: b.id,
                          label: `${b.name}${b.isHV ? " · HV" : ""}`,
                        })),
                      ]}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="— Unassigned —"
                      searchPlaceholder="Search bays…"
                    />
                  </FormControl>
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
