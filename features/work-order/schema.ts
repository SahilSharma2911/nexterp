import { z } from "zod";

export const workOrderFormSchema = z.object({
  bomId: z.string().min(1, "Select a BOM"),
  qty: z.number().positive("Quantity must be > 0"),
  sourceWarehouseId: z.string().optional().nullable(),
  fgWarehouseId: z.string().optional().nullable(),
  useMultiLevelBom: z.boolean(),
  remarks: z.string().trim().optional(),
});

export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;

export const emptyWorkOrder: WorkOrderFormValues = {
  bomId: "",
  qty: 1,
  sourceWarehouseId: null,
  fgWarehouseId: null,
  useMultiLevelBom: true,
  remarks: "",
};

export const finishWorkOrderSchema = z.object({
  qty: z.number().positive().optional(),
});

export type FinishWorkOrderValues = z.infer<typeof finishWorkOrderSchema>;

// ---- read models ----

export const WORK_ORDER_STATUSES = [
  "NOT_STARTED",
  "IN_PROCESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WO_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROCESS: "In Process",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type WorkOrderListItem = {
  id: string;
  name: string;
  itemCode: string;
  itemName: string;
  bomName: string;
  qty: number;
  producedQty: number;
  status: WorkOrderStatus;
};

export type WorkOrderItemRow = {
  id: string;
  itemCode: string;
  itemName: string;
  requiredQty: number;
  consumedQty: number;
  rate: number;
};

export type WorkOrderDetail = {
  id: string;
  name: string;
  itemCode: string;
  itemName: string;
  uom: string;
  bomName: string;
  qty: number;
  producedQty: number;
  status: WorkOrderStatus;
  useMultiLevelBom: boolean;
  sourceWarehouse: string | null;
  fgWarehouse: string | null;
  remarks: string | null;
  items: WorkOrderItemRow[];
  stockEntries: { id: string; name: string; status: string }[];
};

export type WorkOrdersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
