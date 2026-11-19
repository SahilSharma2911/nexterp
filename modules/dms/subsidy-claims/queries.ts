"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as claimsApi from "./api";
import type { SubsidyClaimFormValues } from "./schema";

export const subsidyClaimKeys = {
  all: ["subsidy-claims"] as const,
  lists: () => [...subsidyClaimKeys.all, "list"] as const,
  list: (params: claimsApi.SubsidyClaimsQuery) =>
    [...subsidyClaimKeys.lists(), params] as const,
  detail: (id: string) => [...subsidyClaimKeys.all, "detail", id] as const,
};

export function useSubsidyClaims(params: claimsApi.SubsidyClaimsQuery) {
  return useQuery({
    queryKey: subsidyClaimKeys.list(params),
    queryFn: () => claimsApi.fetchClaims(params),
    placeholderData: keepPreviousData,
  });
}

export function useSubsidyClaim(id?: string) {
  return useQuery({
    queryKey: subsidyClaimKeys.detail(id ?? ""),
    queryFn: () => claimsApi.fetchClaim(id as string),
    enabled: !!id,
  });
}

export function useSubsidyClaimAnalytics() {
  return useQuery({
    queryKey: [...subsidyClaimKeys.all, "analytics"] as const,
    queryFn: () => claimsApi.fetchClaimAnalytics(),
    staleTime: 60_000,
  });
}

export function useCreateSubsidyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SubsidyClaimFormValues) => claimsApi.createClaim(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.all });
      toast.success("Subsidy claim created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSubsidyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: SubsidyClaimFormValues;
    }) => claimsApi.updateClaim(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.all });
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.detail(row.id) });
      toast.success("Subsidy claim updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSubsidyClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimsApi.deleteClaim(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.all });
      toast.success("Subsidy claim deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useClaimAction(fn: (id: string) => Promise<void>, msg: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.all });
      qc.invalidateQueries({ queryKey: subsidyClaimKeys.detail(id) });
      toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useSubmitSubsidyClaim = () =>
  useClaimAction(claimsApi.submitClaim, "Submitted to the authority");
export const useApproveSubsidyClaim = () =>
  useClaimAction(claimsApi.approveClaim, "Approved — e-voucher generated");
export const useDisburseSubsidyClaim = () =>
  useClaimAction(claimsApi.disburseClaim, "Marked disbursed");
export const useRejectSubsidyClaim = () =>
  useClaimAction(claimsApi.rejectClaim, "Claim rejected");
export const useCancelSubsidyClaim = () =>
  useClaimAction(claimsApi.cancelClaim, "Claim cancelled");
