import { z } from "zod";

export const WARRANTY_COMPONENTS = [
  "VEHICLE",
  "POWERTRAIN",
  "BATTERY",
  "MOTOR",
  "CONTROLLER",
  "CHARGER",
  "CORROSION",
] as const;
export type WarrantyComponent = (typeof WARRANTY_COMPONENTS)[number];

export const COMPONENT_LABELS: Record<WarrantyComponent, string> = {
  VEHICLE: "Vehicle (bumper-to-bumper)",
  POWERTRAIN: "Powertrain",
  BATTERY: "Battery",
  MOTOR: "Motor",
  CONTROLLER: "Controller",
  CHARGER: "On-board Charger",
  CORROSION: "Corrosion / Anti-perforation",
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
  autoRegistered: boolean;
  notes: string | null;
  expiryDate: string;
  active: boolean;
  daysLeft: number;
  claimCount: number;
};

// Per-vehicle "Warranty Registration at Sale" overview.
export type WarrantyRegistration = {
  vehicle: {
    id: string;
    vin: string;
    model: string;
    variant: string | null;
    color: string | null;
    status: string;
    batterySoH: number | null;
    customerName: string | null;
    deliveredAt: string | null;
    dealer: string | null;
  };
  covers: Warranty[];
  summary: {
    total: number;
    active: number;
    expired: number;
    nearestExpiry: string | null;
    openClaims: number;
  };
  recentClaims: {
    id: string;
    name: string;
    component: string;
    status: string;
    claimDate: string;
    claimAmount: number;
  }[];
};

export type WarrantyOption = {
  id: string;
  label: string;
  component: WarrantyComponent;
};

export type WarrantyAnalytics = {
  activeCovers: number;
  expiringSoon: number; // active, expiring within 90 days
  vehiclesCovered: number;
  autoRegistered: number;
  byComponent: { name: string; value: number }[]; // active covers per component
  expiring: {
    id: string;
    vehicleId: string;
    vehicle: string;
    component: string;
    expiryDate: string;
    daysLeft: number;
  }[];
};

export type WarrantiesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
