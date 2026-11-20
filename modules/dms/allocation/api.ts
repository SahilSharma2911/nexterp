import { api } from "@/lib/axios";
import type {
  AllocationActivityItem,
  AllocationPlan,
  AllocationRequestFormValues,
  AllocationRequestRow,
  AllocationRule,
  AllocationRuleFormValues,
} from "./schema";

export async function fetchRequests(status?: string) {
  const { data } = await api.get<AllocationRequestRow[]>(
    "/allocation/requests",
    { params: status ? { status } : undefined },
  );
  return data;
}

export async function createRequest(values: AllocationRequestFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/allocation/requests",
    values,
  );
  return data;
}

export async function cancelRequest(id: string) {
  await api.post(`/allocation/requests/${id}/cancel`);
}

export async function deleteRequest(id: string) {
  await api.delete(`/allocation/requests/${id}`);
}

export async function fetchRule() {
  const { data } = await api.get<AllocationRule>("/allocation/rules");
  return data;
}

export async function updateRule(values: AllocationRuleFormValues) {
  const { data } = await api.patch<AllocationRule>("/allocation/rules", values);
  return data;
}

export async function fetchPreview() {
  const { data } = await api.get<AllocationPlan>("/allocation/preview");
  return data;
}

export async function commitAllocation() {
  const { data } = await api.post<{ allocated: number; requests: number }>(
    "/allocation/commit",
  );
  return data;
}

export async function fetchActivity() {
  const { data } = await api.get<AllocationActivityItem[]>(
    "/allocation/activity",
  );
  return data;
}
