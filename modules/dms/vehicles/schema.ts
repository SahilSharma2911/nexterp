import { z } from "zod";

export const VEHICLE_STATUSES = [
  "IN_STOCK",
  "ALLOCATED",
  "IN_TRANSIT",
  "AT_DEALER",
  "PDI_DONE",
  "DELIVERED",
  "IN_SERVICE",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  IN_STOCK: "At Warehouse",
  ALLOCATED: "Allocated",
  IN_TRANSIT: "In Transit",
  AT_DEALER: "At Dealer",
  PDI_DONE: "PDI Passed",
  DELIVERED: "Delivered",
  IN_SERVICE: "In Service",
};

export const vehicleFormSchema = z.object({
  vin: z.string().trim().min(1, "VIN is required"),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional(),
  color: z.string().trim().optional(),
  motorSerial: z.string().trim().optional(),
  batterySerial: z.string().trim().optional(),
  batterySoH: z
    .number()
    .min(0, "0–100")
    .max(100, "0–100")
    .optional()
    .nullable(),
  status: z.enum(VEHICLE_STATUSES),
  mfgDate: z.string().optional().nullable(),
  purchaseRate: z.number().min(0, "Must be ≥ 0"),
  sellingRate: z.number().min(0, "Must be ≥ 0"),
  warehouseId: z.string().optional().nullable(),
  dealerId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const emptyVehicle: VehicleFormValues = {
  vin: "",
  model: "",
  variant: "",
  color: "",
  motorSerial: "",
  batterySerial: "",
  batterySoH: null,
  status: "IN_STOCK",
  mfgDate: "",
  purchaseRate: 0,
  sellingRate: 0,
  warehouseId: "",
  dealerId: "",
  imageUrl: null,
  remarks: "",
};

export type Vehicle = {
  id: string;
  vin: string;
  model: string;
  variant: string | null;
  color: string | null;
  motorSerial: string | null;
  batterySerial: string | null;
  batterySoH: number | null;
  status: VehicleStatus;
  mfgDate: string | null;
  purchaseRate: number;
  sellingRate: number;
  warehouseId: string | null;
  warehouse: string | null;
  dealerId: string | null;
  dealer: string | null;
  imageUrl: string | null;
  remarks: string | null;
};

export type VehicleOption = {
  id: string;
  vin: string;
  model: string;
};

export type VehicleRelated = {
  jobCards: {
    id: string;
    name: string;
    status: string;
    serviceDate: string;
    total: number;
  }[];
  warranties: {
    id: string;
    component: string;
    status: string;
    expiryDate: string;
    active: boolean;
  }[];
  subsidyClaims: {
    id: string;
    name: string;
    scheme: string;
    status: string;
    claimAmount: number;
  }[];
};

export type VehiclesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type VehicleActivity = {
  id: string;
  vehicleId: string;
  vin: string;
  model: string;
  imageUrl: string | null;
  stage: VehicleStatus;
  note: string | null;
  byUser: string | null;
  at: string;
};

// One in-stock unit in the FIFO (oldest-first) allocation queue.
export type FifoVehicle = {
  id: string;
  vin: string;
  model: string;
  variant: string | null;
  warehouse: string | null;
  daysInStock: number;
};

export type VehicleAnalytics = {
  total: number;
  inStock: number;
  inPipeline: number; // allocated → PDI (on the way to a customer)
  delivered: number;
  inventoryValue: number; // cost of unsold units
  deliveredValue: number; // sale value of delivered units
  avgSoH: number | null;
  byStage: { name: string; value: number }[];
  deliveriesByMonth: { name: string; value: number }[];
  recentActivity: VehicleActivity[];
  // FIFO / stock-aging
  oldestDays: number; // age of the oldest in-stock unit
  avgAgeDays: number; // average age of in-stock units
  agingThreshold: number; // "aging" cut-off in days
  agingCount: number; // in-stock units older than the threshold
  fifoQueue: FifoVehicle[]; // in-stock units, oldest first
};
