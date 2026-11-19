import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "BOOKED",
  "CONVERTED",
  "CANCELLED",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Booked",
  CONVERTED: "Converted",
  CANCELLED: "Cancelled",
};

export const appointmentFormSchema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  customerName: z.string().trim().optional(),
  requestedAt: z.string().min(1, "Pick a date & time"),
  isHV: z.boolean(),
  bayId: z.string().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  complaint: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export const emptyAppointment: AppointmentFormValues = {
  vehicleId: "",
  customerName: "",
  requestedAt: "",
  isHV: false,
  bayId: "",
  technicianId: "",
  complaint: "",
  remarks: "",
};

// ---- read models ----

export type AppointmentListItem = {
  id: string;
  name: string;
  vehicle: string;
  vehicleModel: string;
  customerName: string | null;
  requestedAt: string;
  isHV: boolean;
  bay: string | null;
  technician: string | null;
  status: AppointmentStatus;
};

export type AppointmentDetail = {
  id: string;
  name: string;
  vehicleId: string;
  vehicle: string;
  vehicleModel: string;
  customerName: string | null;
  requestedAt: string;
  isHV: boolean;
  bayId: string | null;
  bay: string | null;
  technicianId: string | null;
  technician: string | null;
  complaint: string | null;
  remarks: string | null;
  status: AppointmentStatus;
  jobCardId: string | null;
  jobCardName: string | null;
};

export type AppointmentsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type AppointmentAnalytics = {
  booked: number;
  converted: number;
  cancelled: number;
  hv: number; // booked HV jobs awaiting work
  byStatus: { name: string; value: number }[];
};
