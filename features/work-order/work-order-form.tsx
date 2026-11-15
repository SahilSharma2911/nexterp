"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBomOptions } from "@/features/bom/queries";
import { useWarehouseOptions } from "@/features/warehouses/queries";
import {
  emptyWorkOrder,
  workOrderFormSchema,
  type WorkOrderFormValues,
} from "./schema";
import { useCreateWorkOrder } from "./queries";

export function WorkOrderForm({ defaultBomId }: { defaultBomId?: string }) {
  const router = useRouter();
  const { data: bomOptions = [] } = useBomOptions();
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const create = useCreateWorkOrder();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: { ...emptyWorkOrder, bomId: defaultBomId ?? "" },
  });

  function onSubmit(values: WorkOrderFormValues) {
    create.mutate(values, {
      onSuccess: (r) => router.push(`/manufacturing/work-order/${r.id}`),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bomId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>BOM</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a submitted BOM…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bomOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} · {b.itemCode} — {b.itemName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bomOptions.length === 0 && (
                    <FormDescription>
                      No active submitted BOMs yet — create and submit a BOM
                      first.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Manufacture</FormLabel>
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
              name="useMultiLevelBom"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Use multi-level BOM (explode to raw materials)
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceWarehouseId"
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

            <FormField
              control={form.control}
              name="fgWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finished Goods Warehouse</FormLabel>
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

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create Work Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
