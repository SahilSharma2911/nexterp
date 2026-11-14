import { z } from "zod";

// Single source of truth for the Item form — used by react-hook-form on the
// client AND by the route handler for validation.
export const itemFormSchema = z.object({
  itemCode: z.string().trim().min(1, "Item Code is required"),
  itemName: z.string().trim().min(1, "Item Name is required"),
  description: z.string().trim().optional(),
  itemGroup: z.string().trim().optional(),
  stockUom: z.string().trim().min(1, "UOM is required"),
  isStockItem: z.boolean(),
  hasSerialNo: z.boolean(),
  hasBatchNo: z.boolean(),
  valuationRate: z.number().min(0, "Must be ≥ 0"),
  disabled: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const emptyItem: ItemFormValues = {
  itemCode: "",
  itemName: "",
  description: "",
  itemGroup: "",
  stockUom: "Nos",
  isStockItem: true,
  hasSerialNo: false,
  hasBatchNo: false,
  valuationRate: 0,
  disabled: false,
};

// Full record returned by GET /api/items/:id
export type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  description: string | null;
  itemGroup: string | null;
  stockUom: string;
  isStockItem: boolean;
  hasSerialNo: boolean;
  hasBatchNo: boolean;
  valuationRate: number;
  disabled: boolean;
};

// Lighter row returned by the list endpoint.
export type ItemListItem = {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroup: string | null;
  stockUom: string;
  isStockItem: boolean;
  valuationRate: number;
  disabled: boolean;
};

// Lightweight option for item pickers in documents.
export type ItemOption = {
  id: string;
  itemCode: string;
  itemName: string;
  stockUom: string;
  valuationRate: number;
};

// Shape of the TanStack Table `meta` for the items table.
export type ItemsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
  onEdit: (item: ItemListItem) => void;
};
