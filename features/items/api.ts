import { api } from "@/lib/axios";
import type { ListResponse } from "@/lib/api-list";
import type {
  Item,
  ItemAnalytics,
  ItemFormValues,
  ItemListItem,
  ItemOption,
} from "./schema";

export type ItemsQuery = {
  page: number;
  limit: number;
  q: string;
  sort: string;
  group?: string;
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

// Resolve a scanned/typed barcode (or item code) to an item. Returns null if
// nothing matches.
export async function fetchItemByBarcode(code: string) {
  const { data } = await api.get<ItemOption | null>("/items/by-barcode", {
    params: { code },
  });
  return data;
}

export async function fetchItemAnalytics() {
  const { data } = await api.get<ItemAnalytics>("/items/analytics");
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

export async function generateVariants(id: string) {
  const { data } = await api.post<{ created: number; skipped: number }>(
    `/items/${id}/generate-variants`,
  );
  return data;
}
