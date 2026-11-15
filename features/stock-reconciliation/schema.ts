import { z } from "zod";

export const reconItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  qty: z.number().min(0, "Qty can't be negative"),
  valuationRate: z.number().min(0, "Rate must be ≥ 0"),
});

export const reconciliationFormSchema = z.object({
  remarks: z.string().trim().optional(),
  items: z.array(reconItemSchema).min(1, "Add at least one row"),
});

export type ReconciliationFormValues = z.infer<typeof reconciliationFormSchema>;

export const emptyReconItem = {
  itemId: "",
  warehouseId: "",
  qty: 0,
  valuationRate: 0,
};

export const emptyReconciliation: ReconciliationFormValues = {
  remarks: "",
  items: [{ ...emptyReconItem }],
};

export type ReconciliationListItem = {
  id: string;
  name: string;
  status: string;
  postingAt: string;
  itemCount: number;
};

export type ReconciliationItemRow = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  warehouseId: string;
  warehouse: string;
  qty: number;
  valuationRate: number;
  currentQty: number;
  diff: number | null;
};

export type ReconciliationDetail = {
  id: string;
  name: string;
  status: string;
  postingAt: string;
  remarks: string | null;
  items: ReconciliationItemRow[];
};

export type ReconciliationsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
