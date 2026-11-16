import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  UserCreateValues,
  UserRow,
  UserUpdateValues,
} from "./schema";

export async function fetchUsers(params: ListQuery) {
  const { data } = await api.get<ListResponse<UserRow>>("/users", { params });
  return data;
}

export async function fetchUser(id: string) {
  const { data } = await api.get<UserRow>(`/users/${id}`);
  return data;
}

export async function createUser(values: UserCreateValues) {
  const { data } = await api.post<UserRow>("/users", values);
  return data;
}

export async function updateUser(id: string, values: UserUpdateValues) {
  const { data } = await api.patch<UserRow>(`/users/${id}`, values);
  return data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
