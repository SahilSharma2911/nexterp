import { api } from "@/lib/axios";
import type { ListResponse } from "@/lib/api-list";
import type {
  Item,
  ItemFormValues,
  ItemListItem,
  ItemOption,
} from "./schema";

export type ItemsQuery = {
  page: number;
  limit: number;
  q: string;
  sort: string;
};

export async function fetchItems(params: ItemsQuery) {
  const { data } = await api.get<ListResponse<ItemListItem>>("/items", {
    params,
  });
  return data;
}

export async function fetchItemOptions() {
  const { data } = await api.get<ItemOption[]>("/items/options");
  return data;
}

export async function fetchItem(id: string) {
  const { data } = await api.get<Item>(`/items/${id}`);
  return data;
}

export async function createItem(values: ItemFormValues) {
  const { data } = await api.post<Item>("/items", values);
  return data;
}

export async function updateItem(id: string, values: ItemFormValues) {
  const { data } = await api.patch<Item>(`/items/${id}`, values);
  return data;
}

export async function deleteItem(id: string) {
  await api.delete(`/items/${id}`);
}
