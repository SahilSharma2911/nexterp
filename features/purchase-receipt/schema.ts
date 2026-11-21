import { z } from "zod";

export const prItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
  batchNo: z.string().trim().optional(),
  batchExpiry: z.string().optional().nullable(),
});

export const purchaseReceiptFormSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  purchaseOrderId: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(prItemSchema).min(1, "Add at least one item"),
});

export type PurchaseReceiptFormValues = z.infer<
  typeof purchaseReceiptFormSchema
>;

export const emptyPrItem = {
  itemId: "",
  qty: 1,
  rate: 0,
  batchNo: "",
  batchExpiry: "",
};

export const emptyPurchaseReceipt: PurchaseReceiptFormValues = {
  supplierId: "",
  warehouseId: "",
  purchaseOrderId: null,
  remarks: "",
  items: [{ ...emptyPrItem }],
};

export type PurchaseReceiptListItem = {
  id: string;
  name: string;
  supplier: string;
  warehouse: string;
  status: string;
  totalQty: number;
  totalAmount: number;
  itemCount: number;
  postingAt: string;
};

export type PurchaseReceiptItemRow = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  qty: number;
  rate: number;
  amount: number;
  batchNo: string | null;
  batchExpiry: string | null;
};

export type PurchaseReceiptDetail = {
  id: string;
  name: string;
  supplierId: string;
  warehouseId: string;
  supplier: string;
  warehouse: string;
  purchaseOrderId: string | null;
  status: string;
  postingAt: string;
  remarks: string | null;
  totalQty: number;
  totalAmount: number;
  items: PurchaseReceiptItemRow[];
};

export type PurchaseReceiptsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
