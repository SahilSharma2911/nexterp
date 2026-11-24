import { z } from "zod";

export const itemSpecSchema = z.object({
  label: z.string().trim(),
  value: z.string().trim(),
});

export const itemVariantAttrSchema = z.object({
  attribute: z.string().trim(),
  values: z.string().trim(),
});

// Single source of truth for the Item form — used by react-hook-form on the
// client AND by the route handler for validation.
export const itemFormSchema = z.object({
  itemCode: z.string().trim(), // blank -> auto-generated SKU (e.g. ITEM-00042)
  itemName: z.string().trim().min(1, "Item Name is required"),
  description: z.string().trim().optional(),
  itemGroup: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  taxCode: z.string().trim().optional(),
  rack: z.string().trim().optional(),
  stockUom: z.string().trim().min(1, "UOM is required"),
  isStockItem: z.boolean(),
  hasSerialNo: z.boolean(),
  hasBatchNo: z.boolean(),
  valuationRate: z.number().min(0, "Must be ≥ 0"),
  salesRate: z.number().min(0, "Must be ≥ 0"),
  reorderLevel: z.number().min(0, "Must be ≥ 0"),
  imageUrl: z.string().optional().nullable(),
  disabled: z.boolean(),
  hasVariants: z.boolean(),
  specifications: z.array(itemSpecSchema),
  variantAttributes: z.array(itemVariantAttrSchema),
}).superRefine((v, ctx) => {
  // A template's code is the prefix for every variant SKU, so it can't be
  // auto-generated — require it. Normal items may leave it blank.
  if (v.hasVariants && !v.itemCode.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Give the template an Item Code — it's the prefix for each variant SKU.",
      path: ["itemCode"],
    });
  }
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const emptyItem: ItemFormValues = {
  itemCode: "",
  itemName: "",
  description: "",
  itemGroup: "",
  brand: "",
  barcode: "",
  taxCode: "",
  rack: "",
  stockUom: "Nos",
  isStockItem: true,
  hasSerialNo: false,
  hasBatchNo: false,
  valuationRate: 0,
  salesRate: 0,
  reorderLevel: 0,
  imageUrl: null,
  disabled: false,
  hasVariants: false,
  specifications: [],
  variantAttributes: [],
};

export type ItemSpec = { label: string; value: string };
export type ItemVariantAttr = { attribute: string; values: string };

// Full record returned by GET /api/items/:id
export type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  description: string | null;
  itemGroup: string | null;
  brand: string | null;
  barcode: string | null;
  taxCode: string | null;
  rack: string | null;
  stockUom: string;
  isStockItem: boolean;
  hasSerialNo: boolean;
  hasBatchNo: boolean;
  valuationRate: number;
  salesRate: number;
  reorderLevel: number;
  imageUrl: string | null;
  disabled: boolean;
  hasVariants: boolean;
  variantOfId: string | null;
  variantOfCode: string | null;
  variantOfName: string | null;
  specifications: ItemSpec[];
  variantAttributes: ItemVariantAttr[];
  variants: { id: string; itemCode: string; itemName: string }[];
};

// Lighter row returned by the list endpoint.
export type ItemListItem = {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroup: string | null;
  brand: string | null;
  stockUom: string;
  isStockItem: boolean;
  valuationRate: number;
  disabled: boolean;
  hasVariants: boolean;
  isVariant: boolean;
  imageUrl: string | null;
};

// Lightweight option for item pickers in documents.
export type ItemOption = {
  id: string;
  itemCode: string;
  itemName: string;
  stockUom: string;
  valuationRate: number;
  barcode: string | null;
  hasBatchNo: boolean;
  hasSerialNo: boolean;
};

// Shape of the TanStack Table `meta` for the items table.
export type ItemsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type ItemAnalytics = {
  total: number;
  stockItems: number;
  lowStock: number; // on-hand below reorder level
  stockValue: number; // total valuation across all bins
  byGroup: { name: string; value: number }[];
};
