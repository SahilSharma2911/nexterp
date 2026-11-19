import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  Warehouse,
  WarehouseAnalytics,
  WarehouseFormValues,
  WarehouseOption,
} from "./schema";

export async function fetchWarehouses(params: ListQuery) {
  const { data } = await api.get<ListResponse<Warehouse>>("/warehouses", {
    params,
  });
  return data;
}

export async function fetchWarehouseOptions() {
  const { data } = await api.get<WarehouseOption[]>("/warehouses/options");
  return data;
}

export async function fetchWarehouseAnalytics() {
  const { data } = await api.get<WarehouseAnalytics>("/warehouses/analytics");
  return data;
}

export async function fetchWarehouse(id: string) {
  const { data } = await api.get<Warehouse>(`/warehouses/${id}`);
  return data;
}

export async function createWarehouse(values: WarehouseFormValues) {
  const { data } = await api.post<Warehouse>("/warehouses", values);
  return data;
}

export async function updateWarehouse(id: string, values: WarehouseFormValues) {
  const { data } = await api.patch<Warehouse>(`/warehouses/${id}`, values);
  return data;
}

export async function deleteWarehouse(id: string) {
  await api.delete(`/warehouses/${id}`);
}
