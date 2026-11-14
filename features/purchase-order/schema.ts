import { z } from "zod";

export const poItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  requiredBy: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(poItemSchema).min(1, "Add at least one item"),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const emptyPoItem = { itemId: "", qty: 1, rate: 0 };

export const emptyPurchaseOrder: PurchaseOrderFormValues = {
  supplierId: "",
  warehouseId: "",
  requiredBy: null,
  remarks: "",
  items: [{ ...emptyPoItem }],
};

export type PurchaseOrderListItem = {
  id: string;
  name: string;
  supplier: string;
  status: string;
  totalQty: number;
  totalAmount: number;
  itemCount: number;
};

export type PurchaseOrderItemRow = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  receivedQty: number;
};

export type PurchaseOrderDetail = {
  id: string;
  name: string;
  supplierId: string;
  warehouseId: string;
  supplier: string;
  warehouse: string;
  status: string;
  remarks: string | null;
  totalQty: number;
  totalAmount: number;
  items: PurchaseOrderItemRow[];
};

export type PurchaseOrderPrefill = {
  id: string;
  name: string;
  supplierId: string;
  warehouseId: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    remaining: number;
    rate: number;
  }[];
};

export type PurchaseOrdersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
