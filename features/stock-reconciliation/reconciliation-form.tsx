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
import {
  emptyReconItem,
  emptyReconciliation,
  reconciliationFormSchema,
  type ReconciliationFormValues,
} from "./schema";
import {
  useReconciliation,
  useCreateReconciliation,
  useUpdateReconciliation,
} from "./queries";

export function ReconciliationForm({ reconId }: { reconId?: string }) {
  const router = useRouter();
  const isEdit = !!reconId;
  const { data: existing } = useReconciliation(reconId);
  const { data: itemOptions = [] } = useItemOptions();
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const create = useCreateReconciliation();
  const update = useUpdateReconciliation();

  const form = useForm<ReconciliationFormValues>({
    resolver: zodResolver(reconciliationFormSchema),
    defaultValues: emptyReconciliation,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        remarks: existing.remarks ?? "",
        items: existing.items.map((it) => ({
          itemId: it.itemId,
          warehouseId: it.warehouseId,
          qty: it.qty,
          valuationRate: it.valuationRate,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: ReconciliationFormValues) {
    if (isEdit && reconId) {
      update.mutate(
        { id: reconId, values },
        { onSuccess: (r) => router.push(`/stock/reconciliation/${r.id}`) },
      );
    } else {
      create.mutate(values, {
        onSuccess: (r) => router.push(`/stock/reconciliation/${r.id}`),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardContent>
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="sm:max-w-md">
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional — reason for the count…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Counted stock</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyReconItem })}
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
                    <th className="p-3 font-medium">Warehouse</th>
                    <th className="w-28 p-3 font-medium">Counted Qty</th>
                    <th className="w-32 p-3 font-medium">Valuation Rate</th>
                    <th className="w-10 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((row, i) => (
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
                                  const cur = form.getValues(`items.${i}.valuationRate`);
                                  if (opt && (!cur || cur === 0)) {
                                    form.setValue(
                                      `items.${i}.valuationRate`,
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
                          name={`items.${i}.warehouseId`}
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                value={field.value || undefined}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
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
                                      e.target.value === "" ? 0 : Number(e.target.value),
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
                          name={`items.${i}.valuationRate`}
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
                                      e.target.value === "" ? 0 : Number(e.target.value),
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                  ))}
                </tbody>
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
