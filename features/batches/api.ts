import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  Batch,
  BatchAnalytics,
  BatchFormValues,
  BatchListItem,
} from "./schema";

export type BatchesQuery = ListQuery & { itemId?: string; expiry?: string };

export async function fetchBatches(params: BatchesQuery) {
  const { data } = await api.get<ListResponse<BatchListItem>>("/batches", {
    params,
  });
  return data;
}

export async function fetchBatchAnalytics() {
  const { data } = await api.get<BatchAnalytics>("/batches/analytics");
  return data;
}

export async function fetchBatch(id: string) {
  const { data } = await api.get<Batch>(`/batches/${id}`);
  return data;
}

export async function fetchBatchesForItem(itemId: string) {
  const { data } = await api.get<ListResponse<BatchListItem>>("/batches", {
    params: { itemId, limit: 100 },
  });
  return data.rows;
}

export async function fetchBatchByBarcode(code: string) {
  const { data } = await api.get<Batch | null>("/batches/by-barcode", {
    params: { code },
  });
  return data;
}

export async function createBatch(values: BatchFormValues) {
  const { data } = await api.post<Batch>("/batches", values);
  return data;
}

export async function updateBatch(id: string, values: BatchFormValues) {
  const { data } = await api.patch<Batch>(`/batches/${id}`, values);
  return data;
}

export async function deleteBatch(id: string) {
  await api.delete(`/batches/${id}`);
}
