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
import {
  bomFormSchema,
  emptyBom,
  emptyBomComponent,
  type BomFormValues,
} from "./schema";
import { useBom, useCreateBom, useUpdateBom } from "./queries";

export function BomForm({ bomId }: { bomId?: string }) {
  const router = useRouter();
  const isEdit = !!bomId;
  const { data: existing } = useBom(bomId);
  const { data: itemOptions = [] } = useItemOptions();
  const create = useCreateBom();
  const update = useUpdateBom();

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: emptyBom,
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        itemId: existing.itemId,
        quantity: existing.quantity,
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

  const pending = create.isPending || update.isPending;

  function onSubmit(values: BomFormValues) {
    if (isEdit && bomId) {
      update.mutate(
        { id: bomId, values },
        { onSuccess: (r) => router.push(`/manufacturing/bom/${r.id}`) },
      );
    } else {
      create.mutate(values, {
        onSuccess: (r) => router.push(`/manufacturing/bom/${r.id}`),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finished Item</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
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
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
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
            <h2 className="text-sm font-medium">Components</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyBomComponent })}
            >
              <Plus className="size-4" />
              Add component
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
