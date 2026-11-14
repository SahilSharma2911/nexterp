import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Warehouse, WarehouseFormValues } from "./schema";

export async function fetchWarehouses(params: ListQuery) {
  const { data } = await api.get<ListResponse<Warehouse>>("/warehouses", {
    params,
  });
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
