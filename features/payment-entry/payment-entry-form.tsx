"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountOptions } from "@/features/chart-of-accounts/queries";
import { useCustomerOptions } from "@/features/customers/queries";
import { useSupplierOptions } from "@/features/suppliers/queries";
import {
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPES,
  emptyPaymentEntry,
  paymentEntryFormSchema,
  type PaymentEntryFormValues,
  type PaymentPrefill,
} from "./schema";
import {
  useCreatePaymentEntry,
  usePaymentEntry,
  useUpdatePaymentEntry,
} from "./queries";

export function PaymentEntryForm({
  paymentId,
  prefill,
  invoiceLabel,
}: {
  paymentId?: string;
  prefill?: PaymentPrefill;
  invoiceLabel?: string;
}) {
  const router = useRouter();
  const isEdit = !!paymentId;
  const { data: existing } = usePaymentEntry(paymentId);
  const { data: accountOptions = [] } = useAccountOptions();
  const { data: customerOptions = [] } = useCustomerOptions();
  const { data: supplierOptions = [] } = useSupplierOptions();
  const create = useCreatePaymentEntry();
  const update = useUpdatePaymentEntry();

  const lockedToInvoice = !!prefill && !isEdit;

  const form = useForm<PaymentEntryFormValues>({
    resolver: zodResolver(paymentEntryFormSchema),
    defaultValues: prefill
      ? {
          ...emptyPaymentEntry,
          paymentType: prefill.paymentType,
          customerId: prefill.customerId ?? "",
          supplierId: prefill.supplierId ?? "",
          salesInvoiceId: prefill.salesInvoiceId ?? "",
          purchaseInvoiceId: prefill.purchaseInvoiceId ?? "",
          amount: prefill.amount,
        }
      : emptyPaymentEntry,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        paymentType: existing.paymentType as PaymentEntryFormValues["paymentType"],
        accountId: existing.accountId,
        customerId: existing.customerId ?? "",
        supplierId: existing.supplierId ?? "",
        salesInvoiceId: existing.salesInvoiceId ?? "",
        purchaseInvoiceId: existing.purchaseInvoiceId ?? "",
        amount: existing.amount,
        remarks: existing.remarks ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const paymentType = form.watch("paymentType");
  const pending = create.isPending || update.isPending;

  function onSubmit(values: PaymentEntryFormValues) {
    const done = (r: { id: string }) =>
      router.push(`/accounts/payment-entry/${r.id}`);
    if (isEdit && paymentId) {
      update.mutate({ id: paymentId, values }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={lockedToInvoice}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PAYMENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentType === "RECEIVE" ? (
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={lockedToInvoice}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select customer…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customerOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={lockedToInvoice}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select supplier…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supplierOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.supplierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash / Bank Account</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountOptions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountName}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
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
                  {invoiceLabel && (
                    <FormDescription>Against {invoiceLabel}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional…" {...field} />
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
