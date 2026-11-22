import { z } from "zod";

export const BOOKING_STATUSES = [
  "BOOKED",
  "ALLOTTED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  BOOKED: "Booked",
  ALLOTTED: "Allotted",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Normal",
  3: "Low",
};

export const bookingFormSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().optional(),
  customerId: z.string().optional().nullable(),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional(),
  color: z.string().trim().optional(),
  dealerId: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(3),
  advance: z.number().min(0, "Advance must be ≥ 0"),
  note: z.string().trim().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Server-side: the UI always sends priority/advance, but tolerate partial
// payloads from raw API callers by filling the natural defaults.
export const bookingApiSchema = bookingFormSchema.extend({
  priority: z.number().int().min(1).max(3).default(2),
  advance: z.number().min(0, "Advance must be ≥ 0").default(0),
});

export const emptyBooking: BookingFormValues = {
  customerName: "",
  phone: "",
  customerId: "",
  model: "",
  variant: "",
  color: "",
  dealerId: "",
  priority: 2,
  advance: 0,
  note: "",
};

export type BookingListItem = {
  id: string;
  name: string;
  customerName: string;
  phone: string | null;
  model: string;
  variant: string | null;
  color: string | null;
  dealerId: string | null;
  dealerName: string | null;
  priority: number;
  advance: number;
  status: BookingStatus;
  vehicleId: string | null;
  vin: string | null;
  createdAt: string;
  queuePosition: number | null; // 1-based position among BOOKED for this model
};

export type BookingDetail = BookingListItem & {
  note: string | null;
  vehicleStatus: string | null; // lifecycle status of the allotted vehicle
  allottedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type AvailableVehicle = {
  id: string;
  vin: string;
  model: string;
  variant: string | null;
  color: string | null;
  status: string;
};

export type BookingAnalytics = {
  total: number;
  booked: number;
  allotted: number;
  delivered: number;
  cancelled: number;
  advanceCollected: number;
  byModel: { name: string; value: number }[]; // open (BOOKED) demand per model
};

export type BookingsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type BookingCatalogue = {
  models: string[];
  variants: string[];
  colors: string[];
};
