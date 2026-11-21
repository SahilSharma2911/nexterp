import { z } from "zod";

export const batchFormSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  warehouseId: z.string().optional().nullable(),
  batchNo: z.string().trim().min(1, "Batch / lot number is required"),
  barcode: z.string().trim().optional(),
  mfgDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  qty: z.number().min(0, "Qty must be ≥ 0"),
  supplier: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type BatchFormValues = z.infer<typeof batchFormSchema>;

export const emptyBatch: BatchFormValues = {
  itemId: "",
  warehouseId: "",
  batchNo: "",
  barcode: "",
  mfgDate: "",
  expiryDate: "",
  qty: 0,
  supplier: "",
  notes: "",
};

// Shelf-life state derived from expiryDate vs. today.
export type ExpiryStatus = "expired" | "expiring" | "fresh" | "none";

export const EXPIRY_LABELS: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring: "Expiring soon",
  fresh: "Fresh",
  none: "No expiry",
};

export type BatchListItem = {
  id: string;
  batchNo: string;
  barcode: string | null;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string | null;
  warehouseName: string | null;
  mfgDate: string | null;
  expiryDate: string | null;
  qty: number; // opening / received quantity
  onHand: number; // live balance from the stock ledger
  supplier: string | null;
  expiry: ExpiryStatus;
  daysToExpiry: number | null;
};

export type Batch = BatchListItem & {
  notes: string | null;
  createdAt: string;
};

export type BatchAnalytics = {
  total: number;
  expired: number;
  expiring: number;
  fresh: number;
  totalQty: number;
  expiringSoon: BatchListItem[];
};

export type BatchesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
