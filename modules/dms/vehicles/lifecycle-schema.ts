import { z } from "zod";
import type { VehicleStatus } from "./schema";

// Forward lifecycle order. Each stage knows the single action that advances it.
export const LIFECYCLE_ORDER: VehicleStatus[] = [
  "IN_STOCK",
  "ALLOCATED",
  "IN_TRANSIT",
  "AT_DEALER",
  "PDI_DONE",
  "DELIVERED",
];

// Fixed standard Pre-Delivery Inspection checklist (v1).
export const PDI_CHECKLIST = [
  "Battery State of Health",
  "Motor & controller",
  "Charger & charging cable",
  "Lights & indicators",
  "Brakes",
  "Tyres & wheels",
  "Bodywork & paint",
  "Documents & keys",
] as const;

export const allocateSchema = z.object({
  dealerId: z.string().min(1, "Select a dealer"),
  note: z.string().trim().optional(),
});

export const noteSchema = z.object({
  note: z.string().trim().optional(),
});

export const pdiItemSchema = z.object({
  label: z.string().min(1),
  ok: z.boolean(),
  note: z.string().trim().optional(),
});

export const pdiSchema = z.object({
  inspector: z.string().trim().optional(),
  note: z.string().trim().optional(),
  items: z.array(pdiItemSchema).min(1),
});

export const deliverSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().trim().min(1, "Customer name is required"),
  note: z.string().trim().optional(),
});

export type AllocateValues = z.infer<typeof allocateSchema>;
export type PdiValues = z.infer<typeof pdiSchema>;
export type DeliverValues = z.infer<typeof deliverSchema>;

// ---- read models ----

export type TimelineEvent = {
  id: string;
  stage: VehicleStatus;
  note: string | null;
  dealer: string | null;
  warehouse: string | null;
  byUser: string | null;
  at: string;
};

export type InspectionRead = {
  id: string;
  inspector: string | null;
  result: "PASS" | "FAIL";
  note: string | null;
  createdAt: string;
  items: { label: string; ok: boolean; note: string | null }[];
};

export type VehicleLifecycle = {
  stage: VehicleStatus;
  timeline: TimelineEvent[];
  inspections: InspectionRead[];
};
