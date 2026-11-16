import { z } from "zod";

export const VEHICLE_STATUSES = [
  "IN_STOCK",
  "ALLOCATED",
  "DELIVERED",
  "IN_SERVICE",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  IN_STOCK: "In Stock",
  ALLOCATED: "Allocated",
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
  remarks: string | null;
};

export type VehiclesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
