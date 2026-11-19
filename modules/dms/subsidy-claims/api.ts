import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  SubsidyClaimAnalytics,
  SubsidyClaimDetail,
  SubsidyClaimFormValues,
  SubsidyClaimListItem,
} from "./schema";

export type SubsidyClaimsQuery = ListQuery & { status: string };

export async function fetchClaims(params: SubsidyClaimsQuery) {
  const { data } = await api.get<ListResponse<SubsidyClaimListItem>>(
    "/subsidy-claims",
    { params },
  );
  return data;
}

export async function fetchClaim(id: string) {
  const { data } = await api.get<SubsidyClaimDetail>(`/subsidy-claims/${id}`);
  return data;
}

export async function fetchClaimAnalytics() {
  const { data } = await api.get<SubsidyClaimAnalytics>(
    "/subsidy-claims/analytics",
  );
  return data;
}

export async function createClaim(values: SubsidyClaimFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/subsidy-claims",
    values,
  );
  return data;
}

export async function updateClaim(id: string, values: SubsidyClaimFormValues) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/subsidy-claims/${id}`,
    values,
  );
  return data;
}

export async function deleteClaim(id: string) {
  await api.delete(`/subsidy-claims/${id}`);
}

export async function submitClaim(id: string) {
  await api.post(`/subsidy-claims/${id}/submit`);
}
export async function approveClaim(id: string) {
  await api.post(`/subsidy-claims/${id}/approve`);
}
export async function disburseClaim(id: string) {
  await api.post(`/subsidy-claims/${id}/disburse`);
}
export async function rejectClaim(id: string) {
  await api.post(`/subsidy-claims/${id}/reject`);
}
export async function cancelClaim(id: string) {
  await api.post(`/subsidy-claims/${id}/cancel`);
}
