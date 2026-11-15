import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  ReconciliationDetail,
  ReconciliationFormValues,
  ReconciliationListItem,
} from "./schema";

export type ReconciliationsQuery = ListQuery & { status: string };

export async function fetchReconciliations(params: ReconciliationsQuery) {
  const { data } = await api.get<ListResponse<ReconciliationListItem>>(
    "/stock-reconciliations",
    { params },
  );
  return data;
}

export async function fetchReconciliation(id: string) {
  const { data } = await api.get<ReconciliationDetail>(
    `/stock-reconciliations/${id}`,
  );
  return data;
}

export async function createReconciliation(values: ReconciliationFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/stock-reconciliations",
    values,
  );
  return data;
}

export async function updateReconciliation(
  id: string,
  values: ReconciliationFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/stock-reconciliations/${id}`,
    values,
  );
  return data;
}

export async function deleteReconciliation(id: string) {
  await api.delete(`/stock-reconciliations/${id}`);
}

export async function submitReconciliation(id: string) {
  await api.post(`/stock-reconciliations/${id}/submit`);
}

export async function cancelReconciliation(id: string) {
  await api.post(`/stock-reconciliations/${id}/cancel`);
}
