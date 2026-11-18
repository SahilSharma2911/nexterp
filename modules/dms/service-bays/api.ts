import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  ServiceBay,
  ServiceBayFormValues,
  ServiceBayOption,
} from "./schema";

export async function fetchServiceBays(params: ListQuery) {
  const { data } = await api.get<ListResponse<ServiceBay>>("/service-bays", {
    params,
  });
  return data;
}

export async function fetchServiceBayOptions() {
  const { data } = await api.get<ServiceBayOption[]>("/service-bays/options");
  return data;
}

export async function fetchServiceBay(id: string) {
  const { data } = await api.get<ServiceBay>(`/service-bays/${id}`);
  return data;
}

export async function createServiceBay(values: ServiceBayFormValues) {
  const { data } = await api.post<ServiceBay>("/service-bays", values);
  return data;
}

export async function updateServiceBay(id: string, values: ServiceBayFormValues) {
  const { data } = await api.patch<ServiceBay>(`/service-bays/${id}`, values);
  return data;
}

export async function deleteServiceBay(id: string) {
  await api.delete(`/service-bays/${id}`);
}
