import { z } from "zod";
import type { JobStatus } from "@/modules/dms/job-cards/schema";

export const technicianFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  skills: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  isHVCertified: z.boolean(),
  active: z.boolean(),
});

export type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export const emptyTechnician: TechnicianFormValues = {
  name: "",
  skills: "",
  phone: "",
  isHVCertified: false,
  active: true,
};

export type Technician = {
  id: string;
  name: string;
  skills: string | null;
  phone: string | null;
  isHVCertified: boolean;
  active: boolean;
  jobCount: number;
};

export type TechnicianOption = {
  id: string;
  name: string;
  isHVCertified: boolean;
};

export type TechniciansTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type TechnicianProductivity = {
  id: string;
  name: string;
  isHVCertified: boolean;
  active: boolean;
  openJobs: number;
  completedJobs: number;
  revenue: number;
  avgTurnaroundHours: number | null;
};

export type TechnicianJobRow = {
  id: string;
  name: string;
  status: JobStatus;
  vehicleId: string;
  vin: string;
  model: string;
  total: number;
  isHV: boolean;
  serviceDate: string;
};

export type TechnicianDetail = {
  id: string;
  name: string;
  phone: string | null;
  skills: string | null;
  skillTags: string[];
  isHVCertified: boolean;
  active: boolean;
  createdAt: string;
  // workload & output
  totalJobs: number;
  openJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  hvJobs: number;
  appointments: number;
  revenue: number;
  partsValue: number;
  laborValue: number;
  avgTurnaroundHours: number | null;
  completionsByMonth: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number }[];
  recentJobs: TechnicianJobRow[];
};

export type TechnicianAnalytics = {
  total: number; // all technicians
  active: number;
  hvCertified: number;
  openJobs: number; // open jobs assigned across the team
  busy: number; // technicians with ≥1 open job
  utilization: number; // busy / active, 0–100
  avgJobsPerTech: number;
  workload: { name: string; value: number }[]; // jobs handled per technician
  certification: { name: string; value: number }[]; // HV certified vs standard
  skills: { name: string; value: number }[]; // skill-tag distribution
  productivity: TechnicianProductivity[];
};
