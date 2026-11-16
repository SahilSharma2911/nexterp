import { z } from "zod";

export const salesInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const salesInvoiceFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  dueDate: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(salesInvoiceItemSchema).min(1, "Add at least one item"),
});

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceFormSchema>;

export const emptySalesInvoiceItem = { itemId: "", qty: 1, rate: 0 };

export const emptySalesInvoice: SalesInvoiceFormValues = {
  customerId: "",
  dueDate: "",
  remarks: "",
  items: [{ ...emptySalesInvoiceItem }],
};

// ---- read models ----

export type SalesInvoiceListItem = {
  id: string;
  name: string;
  customer: string;
  status: string;
  total: number;
  outstanding: number;
  postingAt: string;
};

export type SalesInvoiceItem = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
};

export type SalesInvoiceDetail = {
  id: string;
  name: string;
  customerId: string;
  customer: string;
  status: string;
  postingAt: string;
  dueDate: string | null;
  total: number;
  outstanding: number;
  remarks: string | null;
  items: SalesInvoiceItem[];
};

export type SalesInvoicesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
