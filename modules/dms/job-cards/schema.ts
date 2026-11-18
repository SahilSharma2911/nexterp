import { z } from "zod";

export const JOB_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const jobCardPartSchema = z.object({
  itemId: z.string().min(1, "Select a part"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const jobCardLaborSchema = z.object({
  description: z.string().trim().min(1, "Describe the work"),
  hours: z.number().min(0, "Hours must be ≥ 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const jobCardFormSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  warehouseId: z.string().optional().nullable(),
  complaint: z.string().trim().optional(),
  technician: z.string().trim().optional(),
  technicianId: z.string().optional().nullable(),
  bayId: z.string().optional().nullable(),
  isHV: z.boolean().optional(),
  odometer: z.number().int().min(0).optional().nullable(),
  serviceDate: z.string().optional().nullable(),
  parts: z.array(jobCardPartSchema),
  labor: z.array(jobCardLaborSchema),
  photos: z.array(z.string()),
  remarks: z.string().trim().optional(),
});

// Quality-check sign-off recorded before/at completion (non-gating in v1).
export const jobCardQcSchema = z.object({
  qcBy: z.string().trim().min(1, "Who signed off?"),
  qcNote: z.string().trim().optional(),
});

export type JobCardQcValues = z.infer<typeof jobCardQcSchema>;

export type JobCardFormValues = z.infer<typeof jobCardFormSchema>;

export const emptyJobCardPart = { itemId: "", qty: 1, rate: 0 };
export const emptyJobCardLabor = { description: "", hours: 1, rate: 0 };

export const emptyJobCard: JobCardFormValues = {
  vehicleId: "",
  warehouseId: "",
  complaint: "",
  technician: "",
  technicianId: "",
  bayId: "",
  isHV: false,
  odometer: null,
  serviceDate: "",
  parts: [],
  labor: [{ ...emptyJobCardLabor }],
  photos: [],
};

// ---- read models ----

export type JobCardListItem = {
  id: string;
  name: string;
  vehicle: string;
  vehicleModel: string;
  technician: string | null;
  isHV: boolean;
  status: JobStatus;
  serviceDate: string;
  total: number;
};

export type JobCardPart = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
};

export type JobCardLabor = {
  id: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
};

export type JobCardDetail = {
  id: string;
  name: string;
  vehicleId: string;
  vehicle: string;
  vehicleModel: string;
  warehouseId: string | null;
  warehouse: string | null;
  status: JobStatus;
  complaint: string | null;
  technician: string | null;
  technicianId: string | null;
  technicianName: string | null;
  bayId: string | null;
  bayName: string | null;
  isHV: boolean;
  odometer: number | null;
  serviceDate: string;
  partsTotal: number;
  laborTotal: number;
  total: number;
  remarks: string | null;
  photos: string[];
  qcBy: string | null;
  qcAt: string | null;
  qcNote: string | null;
  appointmentId: string | null;
  appointmentName: string | null;
  parts: JobCardPart[];
  labor: JobCardLabor[];
};

export type JobCardsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
