import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Supplier, SupplierFormValues } from "./schema";

export async function fetchSuppliers(params: ListQuery) {
  const { data } = await api.get<ListResponse<Supplier>>("/suppliers", {
    params,
  });
  return data;
}

export async function fetchSupplier(id: string) {
  const { data } = await api.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(values: SupplierFormValues) {
  const { data } = await api.post<Supplier>("/suppliers", values);
  return data;
}

export async function updateSupplier(id: string, values: SupplierFormValues) {
  const { data } = await api.patch<Supplier>(`/suppliers/${id}`, values);
  return data;
}

export async function deleteSupplier(id: string) {
  await api.delete(`/suppliers/${id}`);
}
