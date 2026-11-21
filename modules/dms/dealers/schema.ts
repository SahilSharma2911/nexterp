import { z } from "zod";
import type { VehicleStatus } from "@/modules/dms/vehicles/schema";
import type { AllocationStatus } from "@/modules/dms/allocation/schema";

export const dealerFormSchema = z.object({
  code: z.string().trim().min(1, "Dealer code is required"),
  name: z.string().trim().min(1, "Name is required"),
  logoUrl: z.string().optional().nullable(),
  legalName: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;

export const emptyDealer: DealerFormValues = {
  code: "",
  name: "",
  logoUrl: null,
  legalName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  disabled: false,
};

export type Dealer = {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  legalName: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  disabled: boolean;
  vehicleCount: number;
};

export type DealerOption = {
  id: string;
  code: string;
  name: string;
};

export type DealersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type DealerVehicleRow = {
  id: string;
  vin: string;
  model: string;
  variant: string | null;
  status: VehicleStatus;
  sellingRate: number;
  deliveredAt: string | null;
  imageUrl: string | null;
};

export type DealerDemandRow = {
  id: string;
  name: string; // ALLOC-2026-00001
  model: string;
  variant: string | null;
  qty: number;
  qtyAllocated: number;
  status: AllocationStatus;
  priority: number;
  createdAt: string;
};

export type DealerDetail = Dealer & {
  createdAt: string;
  assigned: number;
  pipeline: number;
  delivered: number;
  deliveredValue: number;
  openDemand: number;
  byStatus: { name: string; value: number }[];
  deliveriesByMonth: { name: string; value: number }[];
  demand: DealerDemandRow[];
  recentVehicles: DealerVehicleRow[];
};

export type DealerLeaderRow = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  assigned: number; // vehicles linked to the dealer
  delivered: number; // vehicles delivered to buyers
  pipeline: number; // allocated / in-transit / at dealer, not yet delivered
  deliveredValue: number; // ₹ sold through this dealer
  openDemand: number; // outstanding allocation qty (pending/partial)
};

export type DealerAnalytics = {
  total: number;
  active: number;
  vehiclesAssigned: number;
  delivered: number;
  deliveredValue: number;
  pipeline: number;
  openDemand: number;
  byDealer: { name: string; value: number }[]; // top dealers by vehicle count
  byRegion: { name: string; value: number }[]; // dealers by state
  topByValue: { name: string; value: number }[]; // top dealers by ₹ delivered
  deliveriesByMonth: { name: string; value: number }[];
  leaderboard: DealerLeaderRow[];
};
