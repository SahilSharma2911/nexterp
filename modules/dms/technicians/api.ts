import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  Technician,
  TechnicianFormValues,
  TechnicianOption,
} from "./schema";

export async function fetchTechnicians(params: ListQuery) {
  const { data } = await api.get<ListResponse<Technician>>("/technicians", {
    params,
  });
  return data;
}

export async function fetchTechnicianOptions() {
  const { data } = await api.get<TechnicianOption[]>("/technicians/options");
  return data;
}

export async function fetchTechnician(id: string) {
  const { data } = await api.get<Technician>(`/technicians/${id}`);
  return data;
}

export async function createTechnician(values: TechnicianFormValues) {
  const { data } = await api.post<Technician>("/technicians", values);
  return data;
}

export async function updateTechnician(id: string, values: TechnicianFormValues) {
  const { data } = await api.patch<Technician>(`/technicians/${id}`, values);
  return data;
}

export async function deleteTechnician(id: string) {
  await api.delete(`/technicians/${id}`);
}
