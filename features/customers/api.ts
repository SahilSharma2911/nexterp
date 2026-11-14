import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Customer, CustomerFormValues } from "./schema";

export async function fetchCustomers(params: ListQuery) {
  const { data } = await api.get<ListResponse<Customer>>("/customers", {
    params,
  });
  return data;
}

export async function fetchCustomer(id: string) {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(values: CustomerFormValues) {
  const { data } = await api.post<Customer>("/customers", values);
  return data;
}

export async function updateCustomer(id: string, values: CustomerFormValues) {
  const { data } = await api.patch<Customer>(`/customers/${id}`, values);
  return data;
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`);
}
