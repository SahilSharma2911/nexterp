import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  ClaimAnalytics,
  ClaimDetail,
  ClaimEligibility,
  ClaimFormValues,
  ClaimJobDefaults,
  ClaimListItem,
} from "./schema";

export type ClaimsQuery = ListQuery & { status: string };

export async function fetchClaims(params: ClaimsQuery) {
  const { data } = await api.get<ListResponse<ClaimListItem>>(
    "/warranty-claims",
    { params },
  );
  return data;
}

export async function fetchClaim(id: string) {
  const { data } = await api.get<ClaimDetail>(`/warranty-claims/${id}`);
  return data;
}

export async function fetchClaimAnalytics() {
  const { data } = await api.get<ClaimAnalytics>("/warranty-claims/analytics");
  return data;
}

export async function fetchClaimEligibility(id: string) {
  const { data } = await api.get<ClaimEligibility>(
    `/warranty-claims/${id}/eligibility`,
  );
  return data;
}

export async function previewEligibility(body: {
  warrantyId: string;
  faultCode?: string;
  odometerKm?: number | null;
}) {
  const { data } = await api.post<ClaimEligibility>(
    "/warranty-claims/check",
    body,
  );
  return data;
}

export async function createClaim(values: ClaimFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/warranty-claims",
    values,
  );
  return data;
}

export async function updateClaim(id: string, values: ClaimFormValues) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/warranty-claims/${id}`,
    values,
  );
  return data;
}

export async function deleteClaim(id: string) {
  await api.delete(`/warranty-claims/${id}`);
}

export async function submitClaim(id: string) {
  await api.post(`/warranty-claims/${id}/submit`);
}

export async function approveClaim(
  id: string,
  body?: { approvedAmount?: number; oemRef?: string },
) {
  await api.post(`/warranty-claims/${id}/approve`, body ?? {});
}

export async function rejectClaim(id: string) {
  await api.post(`/warranty-claims/${id}/reject`);
}

export async function settleClaim(id: string) {
  await api.post(`/warranty-claims/${id}/settle`);
}

export async function cancelClaim(id: string) {
  await api.post(`/warranty-claims/${id}/cancel`);
}

export async function addClaimComment(
  id: string,
  body: { kind?: "COMMENT" | "NOTE"; note: string },
) {
  await api.post(`/warranty-claims/${id}/comment`, body);
}

export async function reimburseClaim(id: string, amount: number) {
  await api.post(`/warranty-claims/${id}/reimburse`, { amount });
}

export async function fetchClaimJobDefaults(jobCardId: string) {
  const { data } = await api.get<ClaimJobDefaults>(
    "/warranty-claims/job-defaults",
    { params: { jobCardId } },
  );
  return data;
}
