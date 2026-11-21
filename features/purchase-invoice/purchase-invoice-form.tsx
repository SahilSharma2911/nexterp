"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { useItemOptions } from "@/features/items/queries";
import { useSupplierOptions } from "@/features/suppliers/queries";
import { usePurchaseReceipt } from "@/features/purchase-receipt/queries";
import {
  emptyPurchaseInvoice,
  emptyPurchaseInvoiceItem,
  purchaseInvoiceFormSchema,
  type PurchaseInvoiceFormValues,
} from "./schema";
import {
  useCreatePurchaseInvoice,
  usePurchaseInvoice,
  useUpdatePurchaseInvoice,
} from "./queries";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function PurchaseInvoiceForm({
  invoiceId,
  prId,
}: {
  invoiceId?: string;
  prId?: string;
}) {
  const router = useRouter();
  const isEdit = !!invoiceId;
  const { data: existing } = usePurchaseInvoice(invoiceId);
  const { data: fromPr } = usePurchaseReceipt(!isEdit ? prId : undefined);
  const { data: itemOptions = [] } = useItemOptions();
  const { data: supplierOptions = [] } = useSupplierOptions();
  const create = useCreatePurchaseInvoice();
  const update = useUpdatePurchaseInvoice();

  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(purchaseInvoiceFormSchema),
    defaultValues: emptyPurchaseInvoice,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        supplierId: existing.supplierId,
        dueDate: existing.dueDate ? existing.dueDate.slice(0, 10) : "",
        remarks: existing.remarks ?? "",
        items: existing.items.map((it) => ({
          itemId: it.itemId,
          qty: it.qty,
          rate: it.rate,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  // Prefill from a purchase receipt ("Create Invoice" on a submitted receipt).
  useEffect(() => {
    if (!isEdit && fromPr) {
      form.reset({
        supplierId: fromPr.supplierId,
        dueDate: "",
        remarks: `Against receipt ${fromPr.name}`,
        items: fromPr.items.map((it) => ({
          itemId: it.itemId,
          qty: it.qty,
          rate: it.rate,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPr]);

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const total = round2(
    (watchedItems ?? []).reduce(
      (s, it) => s + (Number(it?.qty) || 0) * (Number(it?.rate) || 0),
      0,
    ),
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: PurchaseInvoiceFormValues) {
    const done = (r: { id: string }) =>
      router.push(`/accounts/purchase-invoice/${r.id}`);
    if (isEdit && invoiceId) {
      update.mutate({ id: invoiceId, values }, { onSuccess: done });
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
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supplier…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supplierOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.supplierName}
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Items</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyPurchaseInvoiceItem })}
            >
              <Plus className="size-4" />
              Add row
            </Button>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Item</th>
                    <th className="w-28 p-3 font-medium">Qty</th>
                    <th className="w-32 p-3 font-medium">Rate</th>
                    <th className="w-32 p-3 text-right font-medium">Amount</th>
                    <th className="w-10 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((row, i) => {
                    const qty = Number(watchedItems?.[i]?.qty) || 0;
                    const rate = Number(watchedItems?.[i]?.rate) || 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${i}.itemId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value || undefined}
                                  onValueChange={(v) => {
                                    field.onChange(v);
                                    const opt = itemOptions.find(
                                      (o) => o.id === v,
                                    );
                                    const cur = form.getValues(
                                      `items.${i}.rate`,
                                    );
                                    if (opt && (!cur || cur === 0)) {
                                      form.setValue(
                                        `items.${i}.rate`,
                                        opt.valuationRate,
                                      );
                                    }
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select item…" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {itemOptions.map((o) => (
                                      <SelectItem key={o.id} value={o.id}>
                                        {o.itemCode} — {o.itemName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${i}.qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value),
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`items.${i}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value),
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-3 text-right align-middle tabular-nums text-muted-foreground">
                          {fmtMoney(round2(qty * rate))}
                        </td>
                        <td className="p-2 text-right align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={fields.length === 1}
                            onClick={() => remove(i)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="p-3 text-xs font-semibold uppercase text-muted-foreground" colSpan={3}>
                      Total
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {fmtMoney(total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
          {form.formState.errors.items?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}
        </div>

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
