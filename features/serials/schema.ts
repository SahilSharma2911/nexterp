import { z } from "zod";

export const SERIAL_STATUSES = ["IN_STOCK", "DELIVERED", "SCRAPPED"] as const;
export type SerialStatus = (typeof SERIAL_STATUSES)[number];

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
  IN_STOCK: "In stock",
  DELIVERED: "Delivered",
  SCRAPPED: "Scrapped",
};

export const serialFormSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  serialNo: z.string().trim().min(1, "Serial number is required"),
  warehouseId: z.string().optional().nullable(),
  barcode: z.string().trim().optional(),
  status: z.enum(SERIAL_STATUSES),
  notes: z.string().trim().optional(),
});

export type SerialFormValues = z.infer<typeof serialFormSchema>;

export const emptySerial: SerialFormValues = {
  itemId: "",
  serialNo: "",
  warehouseId: "",
  barcode: "",
  status: "IN_STOCK",
  notes: "",
};

export type SerialListItem = {
  id: string;
  serialNo: string;
  barcode: string | null;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string | null;
  warehouseName: string | null;
  status: SerialStatus;
};

export type Serial = SerialListItem & {
  notes: string | null;
  createdAt: string;
};

export type SerialAnalytics = {
  total: number;
  inStock: number;
  delivered: number;
  scrapped: number;
};

export type SerialsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
