import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  JobCardAnalytics,
  JobCardDetail,
  JobCardFormValues,
  JobCardListItem,
  JobCardQcValues,
} from "./schema";

export type JobCardsQuery = ListQuery & { status: string; vehicle?: string };

export async function fetchJobCards(params: JobCardsQuery) {
  const { data } = await api.get<ListResponse<JobCardListItem>>("/job-cards", {
    params,
  });
  return data;
}

export async function fetchJobCard(id: string) {
  const { data } = await api.get<JobCardDetail>(`/job-cards/${id}`);
  return data;
}

export async function fetchJobCardAnalytics() {
  const { data } = await api.get<JobCardAnalytics>("/job-cards/analytics");
  return data;
}

export async function createJobCard(
  values: JobCardFormValues,
  asEstimate = false,
) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/job-cards",
    values,
    { params: asEstimate ? { estimate: 1 } : undefined },
  );
  return data;
}

export async function approveJobCard(id: string, approvedBy?: string) {
  await api.post(`/job-cards/${id}/approve`, { approvedBy });
}

export async function assignJobCard(
  id: string,
  input: { bayId: string | null; technicianId: string | null },
) {
  await api.post(`/job-cards/${id}/assign`, input);
}

export async function updateJobCard(id: string, values: JobCardFormValues) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/job-cards/${id}`,
    values,
  );
  return data;
}

export async function deleteJobCard(id: string) {
  await api.delete(`/job-cards/${id}`);
}

export async function completeJobCard(id: string) {
  await api.post(`/job-cards/${id}/complete`);
}

export async function cancelJobCard(id: string) {
  await api.post(`/job-cards/${id}/cancel`);
}

export async function recordJobCardQc(id: string, values: JobCardQcValues) {
  await api.post(`/job-cards/${id}/qc`, values);
}
