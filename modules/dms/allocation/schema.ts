import { z } from "zod";

export const ALLOCATION_STATUSES = [
  "PENDING",
  "PARTIAL",
  "FULFILLED",
  "CANCELLED",
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Normal",
  3: "Low",
};

export const allocationRequestFormSchema = z.object({
  dealerId: z.string().min(1, "Select a dealer"),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional(),
  qty: z.number().int().positive("Qty must be > 0"),
  priority: z.number().int().min(1).max(3),
  note: z.string().trim().optional(),
});
export type AllocationRequestFormValues = z.infer<
  typeof allocationRequestFormSchema
>;

export const emptyAllocationRequest: AllocationRequestFormValues = {
  dealerId: "",
  model: "",
  variant: "",
  qty: 1,
  priority: 2,
  note: "",
};

export const allocationRuleFormSchema = z.object({
  oldestFirst: z.boolean(),
  matchModel: z.boolean(),
  matchVariant: z.boolean(),
  maxAgeDays: z.number().int().min(0).optional().nullable(),
});
export type AllocationRuleFormValues = z.infer<typeof allocationRuleFormSchema>;

// ---- read models ----

export type AllocationRequestRow = {
  id: string;
  name: string;
  dealerId: string;
  dealer: string;
  model: string;
  variant: string | null;
  qty: number;
  qtyAllocated: number;
  priority: number;
  status: AllocationStatus;
  note: string | null;
  createdAt: string;
};

export type AllocationRule = {
  oldestFirst: boolean;
  matchModel: boolean;
  matchVariant: boolean;
  maxAgeDays: number | null;
};

export type PlanVehicle = {
  id: string;
  vin: string;
  model: string;
  variant: string | null;
  daysInStock: number;
};

export type AllocationPlanLine = {
  requestId: string;
  requestName: string;
  dealer: string;
  model: string;
  variant: string | null;
  need: number;
  vehicles: PlanVehicle[];
};

export type AllocationPlan = {
  lines: AllocationPlanLine[];
  totalVehicles: number;
  unmatched: {
    requestName: string;
    dealer: string;
    model: string;
    variant: string | null;
    short: number;
  }[];
};

export type AllocationActivityItem = {
  id: string;
  vehicleId: string;
  vin: string;
  model: string;
  dealer: string | null;
  byUser: string | null;
  at: string;
};
