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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useItemOptions } from "@/features/items/queries";
import { useWarehouseOptions } from "@/features/warehouses/queries";
import {
  PURPOSE_LABELS,
  STOCK_ENTRY_PURPOSES,
  emptyStockEntry,
  emptyStockEntryItem,
  purposeNeeds,
  stockEntryFormSchema,
  type StockEntryFormValues,
} from "./schema";
import {
  useCreateStockEntry,
  useStockEntry,
  useUpdateStockEntry,
} from "./queries";

export function StockEntryForm({ entryId }: { entryId?: string }) {
  const router = useRouter();
  const isEdit = !!entryId;
  const { data: existing } = useStockEntry(entryId);
  const { data: itemOptions = [] } = useItemOptions();
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const create = useCreateStockEntry();
  const update = useUpdateStockEntry();

  const form = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntryFormSchema),
    defaultValues: emptyStockEntry,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        purpose: existing.purpose,
        fromWarehouseId: existing.fromWarehouseId,
        toWarehouseId: existing.toWarehouseId,
        remarks: existing.remarks ?? "",
        items: existing.items.map((it) => ({
          itemId: it.itemId,
          qty: it.qty,
          basicRate: it.basicRate,
          isFinishedItem: it.isFinishedItem,
          note: it.note ?? "",
          batchNo: it.batchNo ?? "",
          batchExpiry: it.batchExpiry ? it.batchExpiry.slice(0, 10) : "",
          serials: it.serials ?? "",
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const purpose = form.watch("purpose");
  const needs = purposeNeeds(purpose);
  const watchedItems = form.watch("items");
  const isBatchRow = (i: number) =>
    purpose === "MATERIAL_RECEIPT" &&
    !!itemOptions.find((o) => o.id === watchedItems?.[i]?.itemId)?.hasBatchNo;
  const isSerialRow = (i: number) =>
    purpose === "MATERIAL_RECEIPT" &&
    !!itemOptions.find((o) => o.id === watchedItems?.[i]?.itemId)?.hasSerialNo;
  const pending = create.isPending || update.isPending;

  function onSubmit(values: StockEntryFormValues) {
    if (isEdit && entryId) {
      update.mutate(
        { id: entryId, values },
        { onSuccess: (r) => router.push(`/stock/stock-entry/${r.id}`) },
      );
    } else {
      create.mutate(values, {
        onSuccess: (r) => router.push(`/stock/stock-entry/${r.id}`),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STOCK_ENTRY_PURPOSES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PURPOSE_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needs.from && (
              <FormField
                control={form.control}
                name="fromWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Warehouse</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
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
            )}

            {needs.to && (
              <FormField
                control={form.control}
                name="toWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {needs.finished ? "Finished Warehouse" : "Target Warehouse"}
                    </FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
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
            )}

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
              onClick={() => append({ ...emptyStockEntryItem })}
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
                    {needs.finished && (
                      <th className="w-20 p-3 text-center font-medium">
                        Finished
                      </th>
                    )}
                    <th className="p-3 font-medium">Note</th>
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
                                  const cur = form.getValues(
                                    `items.${i}.basicRate`,
                                  );
                                  if (opt && (!cur || cur === 0)) {
                                    form.setValue(
                                      `items.${i}.basicRate`,
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
                          name={`items.${i}.basicRate`}
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
                      {needs.finished && (
                        <td className="p-2 text-center align-middle">
                          <FormField
                            control={form.control}
                            name={`items.${i}.isFinishedItem`}
                            render={({ field }) => (
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </td>
                      )}
                      <td className="p-2 align-top">
                        <FormField
                          control={form.control}
                          name={`items.${i}.note`}
                          render={({ field }) => (
                            <FormControl>
                              <Input placeholder="—" {...field} />
                            </FormControl>
                          )}
                        />
                        {isBatchRow(i) && (
                          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                            <FormField
                              control={form.control}
                              name={`items.${i}.batchNo`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    placeholder="Batch / lot"
                                    className="font-mono text-xs"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`items.${i}.batchExpiry`}
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    type="date"
                                    className="text-xs"
                                    title="Expiry date"
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                              )}
                            />
                          </div>
                        )}
                        {isSerialRow(i) && (
                          <FormField
                            control={form.control}
                            name={`items.${i}.serials`}
                            render={({ field }) => (
                              <FormControl>
                                <Textarea
                                  rows={3}
                                  placeholder="Serial numbers — one per line"
                                  className="mt-1.5 font-mono text-xs"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                            )}
                          />
                        )}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create draft"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
