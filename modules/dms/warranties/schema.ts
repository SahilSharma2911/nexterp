import { z } from "zod";

export const WARRANTY_COMPONENTS = [
  "VEHICLE",
  "BATTERY",
  "MOTOR",
  "CONTROLLER",
  "CHARGER",
] as const;
export type WarrantyComponent = (typeof WARRANTY_COMPONENTS)[number];

export const COMPONENT_LABELS: Record<WarrantyComponent, string> = {
  VEHICLE: "Vehicle (bumper-to-bumper)",
  BATTERY: "Battery",
  MOTOR: "Motor",
  CONTROLLER: "Controller",
  CHARGER: "On-board Charger",
};

export const WARRANTY_STATUSES = ["ACTIVE", "VOID"] as const;
export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number];

export const warrantyFormSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  component: z.enum(WARRANTY_COMPONENTS),
  startDate: z.string().min(1, "Start date is required"),
  months: z.number().int().positive("Months must be > 0"),
  kmLimit: z.number().int().min(0).optional().nullable(),
  soHThreshold: z.number().min(0).max(100).optional().nullable(),
  status: z.enum(WARRANTY_STATUSES),
  notes: z.string().trim().optional(),
});

export type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

export const emptyWarranty: WarrantyFormValues = {
  vehicleId: "",
  component: "VEHICLE",
  startDate: "",
  months: 36,
  kmLimit: null,
  soHThreshold: null,
  status: "ACTIVE",
  notes: "",
};

export type Warranty = {
  id: string;
  vehicleId: string;
  vehicle: string;
  vehicleModel: string;
  component: WarrantyComponent;
  startDate: string;
  months: number;
  kmLimit: number | null;
  soHThreshold: number | null;
  status: WarrantyStatus;
  notes: string | null;
  expiryDate: string;
  active: boolean;
  daysLeft: number;
  claimCount: number;
};

export type WarrantyOption = {
  id: string;
  label: string;
  component: WarrantyComponent;
};

export type WarrantiesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
