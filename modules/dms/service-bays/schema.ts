import { z } from "zod";
import type { AppointmentStatus } from "@/modules/dms/service-appointments/schema";
import type { JobStatus } from "@/modules/dms/job-cards/schema";

export const serviceBayFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  isHV: z.boolean(),
  active: z.boolean(),
});

export type ServiceBayFormValues = z.infer<typeof serviceBayFormSchema>;

export const emptyServiceBay: ServiceBayFormValues = {
  name: "",
  isHV: false,
  active: true,
};

export type ServiceBay = {
  id: string;
  name: string;
  isHV: boolean;
  active: boolean;
  jobCount: number;
};

export type ServiceBayOption = {
  id: string;
  name: string;
  isHV: boolean;
};

export type ServiceBaysTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

// A scheduled appointment, flattened for the workshop schedule views.
export type ScheduleAppointment = {
  id: string;
  name: string; // APPT-2026-00001
  requestedAt: string; // ISO
  customerName: string | null;
  vehicleId: string;
  vin: string;
  model: string;
  bayId: string | null;
  bayName: string | null;
  technicianId: string | null;
  technicianName: string | null;
  isHV: boolean;
  status: AppointmentStatus;
  complaint: string | null;
};

export type TechAvailability = {
  id: string;
  name: string;
  isHVCertified: boolean;
  openJobs: number;
  todayAppointments: number;
  busy: boolean;
};

export type BayUtilization = {
  id: string;
  name: string;
  isHV: boolean;
  active: boolean;
  todayBookings: number;
  openJobs: number;
};

export type ServiceBayDashboard = {
  bays: number;
  activeBays: number;
  hvBays: number;
  todayCount: number;
  upcomingCount: number;
  utilization: number; // busy active bays today / active bays, 0–100
  today: ScheduleAppointment[];
  upcoming: ScheduleAppointment[];
  technicians: TechAvailability[];
  bayUtilization: BayUtilization[];
};

export type BayJobRow = {
  id: string;
  name: string;
  status: JobStatus;
  vehicleId: string;
  vin: string;
  model: string;
  technicianName: string | null;
  total: number;
  isHV: boolean;
  serviceDate: string;
};

export type ServiceBayDetail = {
  id: string;
  name: string;
  isHV: boolean;
  active: boolean;
  createdAt: string;
  totalJobs: number;
  openJobs: number;
  completedJobs: number;
  appointments: number;
  todayBookings: number;
  upcoming: ScheduleAppointment[];
  recentJobs: BayJobRow[];
};
