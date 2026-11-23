import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  RecallAnalytics,
  RecallDetail,
  RecallFormValues,
  RecallItemStatus,
  RecallListItem,
} from "./schema";

export type RecallsQuery = ListQuery & { status?: string; severity?: string };

export async function fetchRecalls(params: RecallsQuery) {
  const { data } = await api.get<ListResponse<RecallListItem>>("/recalls", {
    params,
  });
  return data;
}

export async function fetchRecallAnalytics() {
  const { data } = await api.get<RecallAnalytics>("/recalls/analytics");
  return data;
}

export async function fetchRecall(id: string) {
  const { data } = await api.get<RecallDetail>(`/recalls/${id}`);
  return data;
}

export async function createRecall(values: RecallFormValues) {
  const { data } = await api.post<{ id: string; code: string }>(
    "/recalls",
    values,
  );
  return data;
}

export async function updateRecall(id: string, values: RecallFormValues) {
  const { data } = await api.patch<{ id: string }>(`/recalls/${id}`, values);
  return data;
}

export async function deleteRecall(id: string) {
  await api.delete(`/recalls/${id}`);
}

export async function matchAffected(id: string) {
  const { data } = await api.post<{ added: number }>(`/recalls/${id}/match`);
  return data;
}

export async function addVehicleToRecall(id: string, vehicleId: string) {
  await api.post(`/recalls/${id}/add-vehicle`, { vehicleId });
}

export async function setRecallStatus(id: string, status: "OPEN" | "CLOSED") {
  await api.post(`/recalls/${id}/status`, { status });
}

export async function setItemStatus(
  itemId: string,
  status: RecallItemStatus,
  body?: { jobCardId?: string | null; notes?: string | null },
) {
  await api.patch(`/recall-items/${itemId}`, { status, ...body });
}

export async function removeRecallItem(itemId: string) {
  await api.delete(`/recall-items/${itemId}`);
}
