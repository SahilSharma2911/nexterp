import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  AppointmentAnalytics,
  AppointmentDetail,
  AppointmentFormValues,
  AppointmentListItem,
} from "./schema";

export type AppointmentsQuery = ListQuery & { status?: string };

export async function fetchAppointments(params: AppointmentsQuery) {
  const { data } = await api.get<ListResponse<AppointmentListItem>>(
    "/service-appointments",
    { params },
  );
  return data;
}

export async function fetchAppointment(id: string) {
  const { data } = await api.get<AppointmentDetail>(
    `/service-appointments/${id}`,
  );
  return data;
}

export async function fetchAppointmentAnalytics() {
  const { data } = await api.get<AppointmentAnalytics>(
    "/service-appointments/analytics",
  );
  return data;
}

export async function createAppointment(values: AppointmentFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/service-appointments",
    values,
  );
  return data;
}

export async function updateAppointment(
  id: string,
  values: AppointmentFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/service-appointments/${id}`,
    values,
  );
  return data;
}

export async function deleteAppointment(id: string) {
  await api.delete(`/service-appointments/${id}`);
}

export async function startAppointment(id: string) {
  const { data } = await api.post<{ jobCardId: string; jobCardName: string }>(
    `/service-appointments/${id}/start`,
  );
  return data;
}

export async function cancelAppointment(id: string) {
  await api.post(`/service-appointments/${id}/cancel`);
}

export async function assignAppointment(
  id: string,
  input: { bayId: string | null; technicianId: string | null },
) {
  await api.post(`/service-appointments/${id}/assign`, input);
}
