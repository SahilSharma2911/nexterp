import { z } from "zod";

export const STOCK_ENTRY_PURPOSES = [
  "MATERIAL_RECEIPT",
  "MATERIAL_ISSUE",
  "MATERIAL_TRANSFER",
  "MANUFACTURE",
  "REPACK",
] as const;

export type StockEntryPurpose = (typeof STOCK_ENTRY_PURPOSES)[number];

export const PURPOSE_LABELS: Record<StockEntryPurpose, string> = {
  MATERIAL_RECEIPT: "Material Receipt",
  MATERIAL_ISSUE: "Material Issue",
  MATERIAL_TRANSFER: "Material Transfer",
  MANUFACTURE: "Manufacture",
  REPACK: "Repack",
};

// Which warehouse fields a purpose uses — drives the form + validation.
export function purposeNeeds(purpose: StockEntryPurpose) {
  switch (purpose) {
    case "MATERIAL_RECEIPT":
      return { from: false, to: true, finished: false };
    case "MATERIAL_ISSUE":
      return { from: true, to: false, finished: false };
    case "MATERIAL_TRANSFER":
      return { from: true, to: true, finished: false };
    case "MANUFACTURE":
    case "REPACK":
      return { from: true, to: true, finished: true };
  }
}

export const stockEntryItemSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  basicRate: z.number().min(0, "Rate must be ≥ 0"),
  isFinishedItem: z.boolean(),
  note: z.string().trim().optional(),
  // Batch/lot captured when receiving a batch-tracked item.
  batchNo: z.string().trim().optional(),
  batchExpiry: z.string().optional().nullable(),
});

export const stockEntryFormSchema = z
  .object({
    purpose: z.enum(STOCK_ENTRY_PURPOSES),
    fromWarehouseId: z.string().optional().nullable(),
    toWarehouseId: z.string().optional().nullable(),
    remarks: z.string().trim().optional(),
    items: z.array(stockEntryItemSchema).min(1, "Add at least one item"),
  })
  .superRefine((v, ctx) => {
    const needs = purposeNeeds(v.purpose);
    if (needs.from && !v.fromWarehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source warehouse is required",
        path: ["fromWarehouseId"],
      });
    }
    if (needs.to && !v.toWarehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target warehouse is required",
        path: ["toWarehouseId"],
      });
    }
    if (
      v.purpose === "MATERIAL_TRANSFER" &&
      v.fromWarehouseId &&
      v.toWarehouseId &&
      v.fromWarehouseId === v.toWarehouseId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source and target must differ",
        path: ["toWarehouseId"],
      });
    }
    if (needs.finished && !v.items.some((i) => i.isFinishedItem)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mark at least one row as the finished item",
        path: ["items"],
      });
    }
  });

export type StockEntryFormValues = z.infer<typeof stockEntryFormSchema>;

export const emptyStockEntryItem = {
  itemId: "",
  qty: 1,
  basicRate: 0,
  isFinishedItem: false,
  note: "",
  batchNo: "",
  batchExpiry: "",
};

export const emptyStockEntry: StockEntryFormValues = {
  purpose: "MATERIAL_RECEIPT",
  fromWarehouseId: null,
  toWarehouseId: null,
  remarks: "",
  items: [{ ...emptyStockEntryItem }],
};

// ---- read models ----

export type StockEntryListItem = {
  id: string;
  name: string;
  purpose: StockEntryPurpose;
  status: string;
  postingAt: string;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  itemCount: number;
  valueDifference: number;
};

export type StockEntryItem = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  basicRate: number;
  valuationRate: number;
  amount: number;
  isFinishedItem: boolean;
  note: string | null;
  batchNo: string | null;
  batchExpiry: string | null;
};

export type StockEntryDetail = {
  id: string;
  name: string;
  purpose: StockEntryPurpose;
  status: string;
  postingAt: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  remarks: string | null;
  totalIncomingValue: number;
  totalOutgoingValue: number;
  valueDifference: number;
  items: StockEntryItem[];
};

export type StockEntriesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
