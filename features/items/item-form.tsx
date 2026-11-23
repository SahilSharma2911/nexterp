"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/image-upload";
import { emptyItem, itemFormSchema, type ItemFormValues } from "./schema";
import { COMMON_UOMS } from "./uom";
import { useCreateItem, useItem, useUpdateItem } from "./queries";

type FlagName =
  | "isStockItem"
  | "hasSerialNo"
  | "hasBatchNo"
  | "hasVariants"
  | "disabled";

function FlagField({
  form,
  name,
  label,
  description,
}: {
  form: ReturnType<typeof useForm<ItemFormValues>>;
  name: FlagName;
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
          <FormControl>
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-0.5">
            <FormLabel className="font-normal">{label}</FormLabel>
            <FormDescription className="text-xs">{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}

function NumberField({
  form,
  name,
  label,
  description,
  step = "0.01",
}: {
  form: ReturnType<typeof useForm<ItemFormValues>>;
  name: "valuationRate" | "salesRate" | "reorderLevel";
  label: string;
  description?: string;
  step?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min="0"
              value={field.value}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ItemForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const isEdit = !!itemId;
  const { data: existing, isLoading } = useItem(itemId);
  const create = useCreateItem();
  const update = useUpdateItem();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: emptyItem,
  });
  const specs = useFieldArray({ control: form.control, name: "specifications" });
  const attrs = useFieldArray({
    control: form.control,
    name: "variantAttributes",
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        itemCode: existing.itemCode,
        itemName: existing.itemName,
        description: existing.description ?? "",
        itemGroup: existing.itemGroup ?? "",
        brand: existing.brand ?? "",
        barcode: existing.barcode ?? "",
        taxCode: existing.taxCode ?? "",
        stockUom: existing.stockUom,
        isStockItem: existing.isStockItem,
        hasSerialNo: existing.hasSerialNo,
        hasBatchNo: existing.hasBatchNo,
        valuationRate: existing.valuationRate,
        salesRate: existing.salesRate,
        reorderLevel: existing.reorderLevel,
        imageUrl: existing.imageUrl ?? null,
        disabled: existing.disabled,
        hasVariants: existing.hasVariants,
        specifications: existing.specifications,
        variantAttributes: existing.variantAttributes,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const hasVariants = form.watch("hasVariants");
  const pending = create.isPending || update.isPending;

  function onSubmit(values: ItemFormValues) {
    if (isEdit && itemId) {
      update.mutate(
        { id: itemId, values },
        { onSuccess: (r) => router.push(`/stock/items/${r.id}`) },
      );
    } else {
      create.mutate(values, {
        onSuccess: (r) => router.push(`/stock/items/${r.id}`),
      });
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Code (SKU)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        hasVariants
                          ? "e.g. TSHIRT (required for templates)"
                          : "Leave blank to auto-generate"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {hasVariants
                      ? "Required — it's the prefix for each variant SKU (e.g. TSHIRT → TSHIRT-S-RED)."
                      : "Unique SKU. Leave blank and we'll assign one like ITEM-00042."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Stainless Steel Widget" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockUom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure</FormLabel>
                  <FormControl>
                    <Combobox
                      options={
                        field.value && !COMMON_UOMS.includes(field.value)
                          ? [field.value, ...COMMON_UOMS]
                          : COMMON_UOMS
                      }
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a unit…"
                      searchPlaceholder="Search units…"
                    />
                  </FormControl>
                  <FormDescription>How it&apos;s counted or sold.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Group</FormLabel>
                  <FormControl>
                    <Input placeholder="Raw Material" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax / HSN Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional notes…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              form={form}
              name="valuationRate"
              label="Valuation Rate (cost)"
              description="Default cost when no prior stock exists."
            />
            <NumberField
              form={form}
              name="salesRate"
              label="Standard Selling Rate"
              description="Default price on sales documents."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inventory &amp; tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FlagField
                form={form}
                name="isStockItem"
                label="Maintain stock"
                description="Track this item in inventory (uncheck for services/fees)."
              />
              <FlagField
                form={form}
                name="hasSerialNo"
                label="Has serial numbers"
                description="Each unit has a unique serial, entered during receipt/delivery."
              />
              <FlagField
                form={form}
                name="hasBatchNo"
                label="Has batch numbers"
                description="Units move in lots/batches (e.g. with an expiry date)."
              />
              <FlagField
                form={form}
                name="hasVariants"
                label="Has variants (template)"
                description="A template that generates child items from attributes."
              />
              <FlagField
                form={form}
                name="disabled"
                label="Disabled"
                description="Hide this item from pickers and new documents."
              />
            </div>
            <div className="sm:max-w-xs">
              <NumberField
                form={form}
                name="reorderLevel"
                label="Reorder Level"
                description="Flag for restock when stock falls below (0 = off)."
                step="0.001"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Specifications</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => specs.append({ label: "", value: "" })}
            >
              <Plus className="size-4" />
              Add specification
            </Button>
          </CardHeader>
          <CardContent>
            {specs.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specifications. Add attributes like Material, Weight, Colour,
                Dimensions…
              </p>
            ) : (
              <div className="space-y-2">
                {specs.fields.map((row, i) => (
                  <div key={row.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`specifications.${i}.label`}
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormControl>
                            <Input placeholder="Label (e.g. Material)" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`specifications.${i}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Value (e.g. Stainless Steel)" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      onClick={() => specs.remove(i)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {hasVariants && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Variant attributes</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attrs.append({ attribute: "", values: "" })}
              >
                <Plus className="size-4" />
                Add attribute
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Define attributes and their comma-separated values (e.g. Size →
                S, M, L). After saving, use “Generate Variants” to create the
                child items for every combination.
              </p>
              {attrs.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attributes yet.</p>
              ) : (
                <div className="space-y-2">
                  {attrs.fields.map((row, i) => (
                    <div key={row.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`variantAttributes.${i}.attribute`}
                        render={({ field }) => (
                          <FormItem className="w-1/3">
                            <FormControl>
                              <Input placeholder="Attribute (e.g. Size)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`variantAttributes.${i}.values`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Values, comma-separated (S, M, L)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        onClick={() => attrs.remove(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
