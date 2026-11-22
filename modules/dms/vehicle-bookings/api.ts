import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  AvailableVehicle,
  BookingAnalytics,
  BookingCatalogue,
  BookingDetail,
  BookingFormValues,
  BookingListItem,
} from "./schema";

export type BookingsQuery = ListQuery & { status?: string; model?: string };

export async function fetchBookings(params: BookingsQuery) {
  const { data } = await api.get<ListResponse<BookingListItem>>(
    "/vehicle-bookings",
    { params },
  );
  return data;
}

export async function fetchBookingAnalytics() {
  const { data } = await api.get<BookingAnalytics>("/vehicle-bookings/analytics");
  return data;
}

export async function fetchBookingCatalogue() {
  const { data } = await api.get<BookingCatalogue>(
    "/vehicle-bookings/catalogue",
  );
  return data;
}

export async function fetchBooking(id: string) {
  const { data } = await api.get<BookingDetail>(`/vehicle-bookings/${id}`);
  return data;
}

export async function fetchAvailableVehicles(id: string) {
  const { data } = await api.get<AvailableVehicle[]>(
    `/vehicle-bookings/${id}/available`,
  );
  return data;
}

export async function createBooking(values: BookingFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/vehicle-bookings",
    values,
  );
  return data;
}

export async function updateBooking(id: string, values: BookingFormValues) {
  const { data } = await api.patch<{ id: string }>(
    `/vehicle-bookings/${id}`,
    values,
  );
  return data;
}

export async function deleteBooking(id: string) {
  await api.delete(`/vehicle-bookings/${id}`);
}

export async function allotBooking(id: string, vehicleId: string) {
  await api.post(`/vehicle-bookings/${id}/allot`, { vehicleId });
}

export async function allotNextVehicle(id: string) {
  await api.post(`/vehicle-bookings/${id}/allot-next`);
}

export async function deliverBooking(id: string) {
  await api.post(`/vehicle-bookings/${id}/deliver`);
}

export async function cancelBooking(id: string) {
  await api.post(`/vehicle-bookings/${id}/cancel`);
}
