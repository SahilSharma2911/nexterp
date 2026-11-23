"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useWarrantyOptions } from "@/modules/dms/warranties/queries";
import { fetchClaimJobDefaults } from "./api";
import { claimFormSchema, emptyClaim, type ClaimFormValues } from "./schema";
import { useClaim, useCreateClaim, useUpdateClaim } from "./queries";

function numChange(onChange: (v: number) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? 0 : Number(e.target.value));
}

// <textarea> one-per-line <-> string[]
const linesToArr = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);

export function ClaimForm({
  claimId,
  prefillWarrantyId,
  prefillJobCardId,
}: {
  claimId?: string;
  prefillWarrantyId?: string;
  prefillJobCardId?: string;
}) {
  const router = useRouter();
  const isEdit = !!claimId;
  const { data: existing, isLoading } = useClaim(claimId);
  const { data: warrantyOptions = [] } = useWarrantyOptions();
  const create = useCreateClaim();
  const update = useUpdateClaim();

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      ...emptyClaim,
      warrantyId: prefillWarrantyId ?? "",
      jobCardId: prefillJobCardId ?? "",
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        warrantyId: existing.warrantyId,
        jobCardId: existing.jobCardId ?? "",
        claimDate: existing.claimDate ? existing.claimDate.slice(0, 10) : "",
        faultCode: existing.faultCode ?? "",
        laborCode: existing.laborCode ?? "",
        diagnosis: existing.diagnosis ?? "",
        partsNeeded: existing.partsNeeded ?? "",
        evidence: existing.evidence,
        documents: existing.documents,
        description: existing.description ?? "",
        claimAmount: existing.claimAmount,
        expectedReimburseAt: existing.expectedReimburseAt
          ? existing.expectedReimburseAt.slice(0, 10)
          : "",
        remarks: existing.remarks ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  // Pre-populate a NEW claim from a job card (fault/diagnosis, parts, cost, photos).
  const prefilled = useRef(false);
  useEffect(() => {
    if (isEdit || !prefillJobCardId || prefilled.current) return;
    prefilled.current = true;
    fetchClaimJobDefaults(prefillJobCardId)
      .then((d) => {
        form.reset({
          ...form.getValues(),
          warrantyId: prefillWarrantyId || d.warrantyId || "",
          jobCardId: d.jobCardId,
          diagnosis: d.diagnosis ?? "",
          partsNeeded: d.partsNeeded ?? "",
          description: d.description ?? "",
          claimAmount: d.claimAmount,
          evidence: d.photos,
        });
        toast.success(`Pre-filled from ${d.jobCard}`);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, prefillJobCardId]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: ClaimFormValues) {
    const done = (r: { id: string }) =>
      router.push(`/dms/warranty-claims/${r.id}`);
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
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="warrantyId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Warranty</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an active warranty…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warrantyOptions.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Eligibility (coverage, battery SoH, fault code, maintenance) is
                    checked when you submit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faultCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fault code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. P0A80, BMS-012…" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="laborCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor code</FormLabel>
                  <FormControl>
                    <Input placeholder="OEM labor op code" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Technician's diagnosis…" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partsNeeded"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Parts needed</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Battery module ×1, Coolant pump ×1" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="claimDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
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
                  <FormLabel>Claim amount</FormLabel>
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
              name="expectedReimburseAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected reimbursement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Photo / video evidence</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="One URL per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(e) => field.onChange(linesToArr(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>One link per line.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documents"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Documents to submit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="One document name / URL per line"
                      value={(field.value ?? []).join("\n")}
                      onChange={(e) => field.onChange(linesToArr(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Fault reported…" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
