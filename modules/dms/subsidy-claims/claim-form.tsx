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
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/image-upload";
import { useVehicleOptions } from "@/modules/dms/vehicles/queries";
import { useSchemeOptions } from "@/modules/dms/subsidy-schemes/queries";
import {
  KYC_DOC_TYPES,
  emptySubsidyClaim,
  subsidyClaimFormSchema,
  type SubsidyClaimFormValues,
} from "./schema";
import {
  useCreateSubsidyClaim,
  useSubsidyClaim,
  useUpdateSubsidyClaim,
} from "./queries";

export function SubsidyClaimForm({
  claimId,
  prefillVehicleId,
}: {
  claimId?: string;
  prefillVehicleId?: string;
}) {
  const router = useRouter();
  const isEdit = !!claimId;
  const { data: existing, isLoading } = useSubsidyClaim(claimId);
  const { data: schemeOptions = [] } = useSchemeOptions();
  const { data: vehicleOptions = [] } = useVehicleOptions();
  const create = useCreateSubsidyClaim();
  const update = useUpdateSubsidyClaim();

  const form = useForm<SubsidyClaimFormValues>({
    resolver: zodResolver(subsidyClaimFormSchema),
    defaultValues: prefillVehicleId
      ? { ...emptySubsidyClaim, vehicleId: prefillVehicleId }
      : emptySubsidyClaim,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        schemeId: existing.schemeId,
        vehicleId: existing.vehicleId,
        customerName: existing.customerName,
        kycDocType: existing.kycDocType ?? "",
        kycRef: existing.kycRef ?? "",
        kycDocUrl: existing.kycDocUrl ?? null,
        kycVerified: existing.kycVerified,
        claimAmount: existing.claimAmount,
        remarks: existing.remarks ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: SubsidyClaimFormValues) {
    const done = (r: { id: string }) =>
      router.push(`/dms/subsidy-claims/${r.id}`);
    if (isEdit && claimId) {
      update.mutate({ id: claimId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Claim</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="schemeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheme</FormLabel>
                  <FormControl>
                    <Combobox
                      options={schemeOptions.map((s) => ({
                        value: s.id,
                        label: `${s.code} — ${s.name}`,
                      }))}
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const s = schemeOptions.find((o) => o.id === v);
                        const cur = form.getValues("claimAmount");
                        if (s && (!cur || cur === 0))
                          form.setValue("claimAmount", s.amount);
                      }}
                      placeholder="Select scheme…"
                      searchPlaceholder="Search schemes…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="claimAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
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
                <FormItem className="lg:col-span-3">
                  <FormLabel>Customer (buyer)</FormLabel>
                  <FormControl>
                    <Input placeholder="Buyer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KYC</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="kycDocType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <FormControl>
                    <Input
                      list="kyc-doc-types"
                      placeholder="Aadhaar"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <datalist id="kyc-doc-types">
                    {KYC_DOC_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kycRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kycVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">KYC verified</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kycDocUrl"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>KYC Document</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} />
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
