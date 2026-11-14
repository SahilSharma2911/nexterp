"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
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
import { useItemOptions } from "@/features/items/queries";
import { useWarehouseOptions } from "@/features/warehouses/queries";
import { useCustomerOptions } from "@/features/customers/queries";
import { useSalesOrderPrefill } from "@/features/sales-order/queries";
import { fmtMoney } from "@/lib/format";
import {
  emptyDnItem,
  emptyDeliveryNote,
  deliveryNoteFormSchema,
  type DeliveryNoteFormValues,
} from "./schema";
import {
  useDeliveryNote,
  useCreateDeliveryNote,
  useUpdateDeliveryNote,
} from "./queries";

export function DeliveryNoteForm({
  noteId,
  soId,
}: {
  noteId?: string;
  soId?: string;
}) {
  const router = useRouter();
  const isEdit = !!noteId;
  const { data: existing } = useDeliveryNote(noteId);
  const { data: prefill } = useSalesOrderPrefill(soId);
  const { data: itemOptions = [] } = useItemOptions();
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const { data: customerOptions = [] } = useCustomerOptions();
  const create = useCreateDeliveryNote();
  const update = useUpdateDeliveryNote();

  const form = useForm<DeliveryNoteFormValues>({
    resolver: zodResolver(deliveryNoteFormSchema),
    defaultValues: emptyDeliveryNote,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        customerId: existing.customerId,
        warehouseId: existing.warehouseId,
        salesOrderId: existing.salesOrderId,
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

  useEffect(() => {
    if (!isEdit && prefill) {
      form.reset({
        customerId: prefill.customerId,
        warehouseId: prefill.warehouseId,
        salesOrderId: prefill.id,
        remarks: "",
        items: prefill.items.map((it) => ({
          itemId: it.itemId,
          qty: it.remaining,
          rate: it.rate,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, isEdit]);

  const linked = !isEdit && !!prefill;
  const watched = form.watch("items");
  const total = (watched ?? []).reduce(
    (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
    0,
  );
  const pending = create.isPending || update.isPending;

  function onSubmit(values: DeliveryNoteFormValues) {
    if (isEdit && noteId) {
      update.mutate(
        { id: noteId, values },
        { onSuccess: (r) => router.push(`/selling/delivery-note/${r.id}`) },
      );
    } else {
      create.mutate(values, {
        onSuccess: (r) => router.push(`/selling/delivery-note/${r.id}`),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {linked && (
          <p className="rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
            Delivering against{" "}
            <span className="font-mono font-medium">{prefill?.name}</span> —
            customer and warehouse are locked to the order.
          </p>
        )}
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={linked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
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
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ship From</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={linked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              onClick={() => append({ ...emptyDnItem })}
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
                    const r = watched?.[i];
                    const amount = (Number(r?.qty) || 0) * (Number(r?.rate) || 0);
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
                                    const opt = itemOptions.find((o) => o.id === v);
                                    const cur = form.getValues(`items.${i}.rate`);
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
                          {fmtMoney(amount)}
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
                    <td colSpan={3} className="p-3 text-right text-sm font-medium">
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
