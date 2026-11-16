import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { Account, AccountFormValues, AccountOption } from "./schema";

export async function fetchAccounts(params: ListQuery) {
  const { data } = await api.get<ListResponse<Account>>("/accounts", { params });
  return data;
}

export async function fetchAccountOptions() {
  const { data } = await api.get<AccountOption[]>("/accounts/options");
  return data;
}

export async function fetchAccount(id: string) {
  const { data } = await api.get<Account>(`/accounts/${id}`);
  return data;
}

export async function createAccount(values: AccountFormValues) {
  const { data } = await api.post<Account>("/accounts", values);
  return data;
}

export async function updateAccount(id: string, values: AccountFormValues) {
  const { data } = await api.patch<Account>(`/accounts/${id}`, values);
  return data;
}

export async function deleteAccount(id: string) {
  await api.delete(`/accounts/${id}`);
}

export async function seedAccounts() {
  const { data } = await api.post<{ created: number }>("/accounts/seed");
  return data;
}
