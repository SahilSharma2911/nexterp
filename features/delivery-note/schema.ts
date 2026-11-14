import { z } from "zod";

export const dnItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const deliveryNoteFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  salesOrderId: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(dnItemSchema).min(1, "Add at least one item"),
});

export type DeliveryNoteFormValues = z.infer<typeof deliveryNoteFormSchema>;

export const emptyDnItem = { itemId: "", qty: 1, rate: 0 };

export const emptyDeliveryNote: DeliveryNoteFormValues = {
  customerId: "",
  warehouseId: "",
  salesOrderId: null,
  remarks: "",
  items: [{ ...emptyDnItem }],
};

export type DeliveryNoteListItem = {
  id: string;
  name: string;
  customer: string;
  warehouse: string;
  status: string;
  totalQty: number;
  totalAmount: number;
  itemCount: number;
  postingAt: string;
};

export type DeliveryNoteItemRow = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  qty: number;
  rate: number;
  amount: number;
  valuationRate: number;
};

export type DeliveryNoteDetail = {
  id: string;
  name: string;
  customerId: string;
  warehouseId: string;
  customer: string;
  warehouse: string;
  salesOrderId: string | null;
  status: string;
  postingAt: string;
  remarks: string | null;
  totalQty: number;
  totalAmount: number;
  totalCogs: number;
  items: DeliveryNoteItemRow[];
};

export type DeliveryNotesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
