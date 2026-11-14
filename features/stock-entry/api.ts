import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  StockEntryDetail,
  StockEntryFormValues,
  StockEntryListItem,
} from "./schema";

export type StockEntriesQuery = ListQuery & { status: string };

export async function fetchStockEntries(params: StockEntriesQuery) {
  const { data } = await api.get<ListResponse<StockEntryListItem>>(
    "/stock-entries",
    { params },
  );
  return data;
}

export async function fetchStockEntry(id: string) {
  const { data } = await api.get<StockEntryDetail>(`/stock-entries/${id}`);
  return data;
}

export async function createStockEntry(values: StockEntryFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/stock-entries",
    values,
  );
  return data;
}

export async function updateStockEntry(
  id: string,
  values: StockEntryFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/stock-entries/${id}`,
    values,
  );
  return data;
}

export async function deleteStockEntry(id: string) {
  await api.delete(`/stock-entries/${id}`);
}

export async function submitStockEntry(id: string) {
  await api.post(`/stock-entries/${id}/submit`);
}

export async function cancelStockEntry(id: string) {
  await api.post(`/stock-entries/${id}/cancel`);
}
