import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Warranty, WarrantyFormValues, WarrantyOption } from "./schema";

export type WarrantiesQuery = ListQuery & { status: string; component: string };

export async function fetchWarranties(params: WarrantiesQuery) {
  const { data } = await api.get<ListResponse<Warranty>>("/warranties", {
    params,
  });
  return data;
}

export async function fetchWarrantyOptions(vehicleId?: string) {
  const { data } = await api.get<WarrantyOption[]>("/warranties/options", {
    params: vehicleId ? { vehicle: vehicleId } : undefined,
  });
  return data;
}

export async function fetchWarranty(id: string) {
  const { data } = await api.get<Warranty>(`/warranties/${id}`);
  return data;
}

export async function createWarranty(values: WarrantyFormValues) {
  const { data } = await api.post<Warranty>("/warranties", values);
  return data;
}

export async function updateWarranty(id: string, values: WarrantyFormValues) {
  const { data } = await api.patch<Warranty>(`/warranties/${id}`, values);
  return data;
}

export async function deleteWarranty(id: string) {
  await api.delete(`/warranties/${id}`);
}
