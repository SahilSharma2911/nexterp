import { z } from "zod";

export const soItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const salesOrderFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  deliveryDate: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
  items: z.array(soItemSchema).min(1, "Add at least one item"),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderFormSchema>;

export const emptySoItem = { itemId: "", qty: 1, rate: 0 };

export const emptySalesOrder: SalesOrderFormValues = {
  customerId: "",
  warehouseId: "",
  deliveryDate: null,
  remarks: "",
  items: [{ ...emptySoItem }],
};

export type SalesOrderListItem = {
  id: string;
  name: string;
  customer: string;
  status: string;
  totalQty: number;
  totalAmount: number;
  itemCount: number;
};

export type SalesOrderItemRow = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  deliveredQty: number;
};

export type SalesOrderDetail = {
  id: string;
  name: string;
  customerId: string;
  warehouseId: string;
  customer: string;
  warehouse: string;
  status: string;
  remarks: string | null;
  totalQty: number;
  totalAmount: number;
  items: SalesOrderItemRow[];
};

export type SalesOrderPrefill = {
  id: string;
  name: string;
  customerId: string;
  warehouseId: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    remaining: number;
    rate: number;
  }[];
};

export type SalesOrdersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
