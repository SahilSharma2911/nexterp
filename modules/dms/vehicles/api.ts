import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Vehicle, VehicleFormValues } from "./schema";

export type VehiclesQuery = ListQuery & { status: string };

export async function fetchVehicles(params: VehiclesQuery) {
  const { data } = await api.get<ListResponse<Vehicle>>("/vehicles", { params });
  return data;
}

export async function fetchVehicle(id: string) {
  const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function createVehicle(values: VehicleFormValues) {
  const { data } = await api.post<Vehicle>("/vehicles", values);
  return data;
}

export async function updateVehicle(id: string, values: VehicleFormValues) {
  const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, values);
  return data;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/vehicles/${id}`);
}
