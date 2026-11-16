import { z } from "zod";

export const purchaseInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const purchaseInvoiceFormSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  dueDate: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(purchaseInvoiceItemSchema).min(1, "Add at least one item"),
});

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceFormSchema>;

export const emptyPurchaseInvoiceItem = { itemId: "", qty: 1, rate: 0 };

export const emptyPurchaseInvoice: PurchaseInvoiceFormValues = {
  supplierId: "",
  dueDate: "",
  remarks: "",
  items: [{ ...emptyPurchaseInvoiceItem }],
};

// ---- read models ----

export type PurchaseInvoiceListItem = {
  id: string;
  name: string;
  supplier: string;
  status: string;
  total: number;
  outstanding: number;
  postingAt: string;
};

export type PurchaseInvoiceItem = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
};

export type PurchaseInvoiceDetail = {
  id: string;
  name: string;
  supplierId: string;
  supplier: string;
  status: string;
  postingAt: string;
  dueDate: string | null;
  total: number;
  outstanding: number;
  remarks: string | null;
  items: PurchaseInvoiceItem[];
};

export type PurchaseInvoicesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
