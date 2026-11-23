"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as claimsApi from "./api";
import type { ClaimFormValues } from "./schema";

export const claimKeys = {
  all: ["warranty-claims"] as const,
  lists: () => [...claimKeys.all, "list"] as const,
  list: (params: claimsApi.ClaimsQuery) =>
    [...claimKeys.lists(), params] as const,
  detail: (id: string) => [...claimKeys.all, "detail", id] as const,
};

export function useClaims(params: claimsApi.ClaimsQuery) {
  return useQuery({
    queryKey: claimKeys.list(params),
    queryFn: () => claimsApi.fetchClaims(params),
    placeholderData: keepPreviousData,
  });
}

export function useClaim(id?: string) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ""),
    queryFn: () => claimsApi.fetchClaim(id as string),
    enabled: !!id,
  });
}

export function useClaimAnalytics() {
  return useQuery({
    queryKey: [...claimKeys.all, "analytics"] as const,
    queryFn: () => claimsApi.fetchClaimAnalytics(),
    staleTime: 60_000,
  });
}

export function useClaimEligibility(id?: string) {
  return useQuery({
    queryKey: [...claimKeys.all, "eligibility", id ?? ""] as const,
    queryFn: () => claimsApi.fetchClaimEligibility(id as string),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ClaimFormValues) => claimsApi.createClaim(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claimKeys.all });
      toast.success("Claim created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ClaimFormValues }) =>
      claimsApi.updateClaim(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: claimKeys.all });
      qc.invalidateQueries({ queryKey: claimKeys.detail(row.id) });
      toast.success("Claim updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimsApi.deleteClaim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claimKeys.all });
      toast.success("Claim deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// One hook factory for the status transitions (submit/approve/reject/settle/cancel).
function useClaimAction(
  fn: (id: string) => Promise<void>,
  msg: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: claimKeys.all });
      qc.invalidateQueries({ queryKey: claimKeys.detail(id) });
      toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useSubmitClaim = () =>
  useClaimAction(claimsApi.submitClaim, "Claim submitted — eligibility checked");
export const useApproveClaim = () =>
  useClaimAction((id) => claimsApi.approveClaim(id), "Claim approved");
export const useRejectClaim = () =>
  useClaimAction(claimsApi.rejectClaim, "Claim rejected");
export const useSettleClaim = () =>
  useClaimAction(claimsApi.settleClaim, "Claim settled");
export const useCancelClaim = () =>
  useClaimAction(claimsApi.cancelClaim, "Claim cancelled");
