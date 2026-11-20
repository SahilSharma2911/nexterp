"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vehicleKeys } from "@/modules/dms/vehicles/queries";
import * as a from "./api";
import type {
  AllocationRequestFormValues,
  AllocationRuleFormValues,
} from "./schema";

export const allocationKeys = {
  all: ["allocation"] as const,
  requests: (status?: string) =>
    [...allocationKeys.all, "requests", status ?? "all"] as const,
  rule: () => [...allocationKeys.all, "rule"] as const,
  preview: () => [...allocationKeys.all, "preview"] as const,
  activity: () => [...allocationKeys.all, "activity"] as const,
};

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: allocationKeys.all });
    qc.invalidateQueries({ queryKey: vehicleKeys.all });
  };
}

export function useAllocationRequests(status?: string) {
  return useQuery({
    queryKey: allocationKeys.requests(status),
    queryFn: () => a.fetchRequests(status),
  });
}

export function useAllocationRule() {
  return useQuery({
    queryKey: allocationKeys.rule(),
    queryFn: () => a.fetchRule(),
  });
}

export function useAllocationPreview(enabled: boolean) {
  return useQuery({
    queryKey: allocationKeys.preview(),
    queryFn: () => a.fetchPreview(),
    enabled,
  });
}

export function useAllocationActivity() {
  return useQuery({
    queryKey: allocationKeys.activity(),
    queryFn: () => a.fetchActivity(),
  });
}

export function useCreateRequest() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: AllocationRequestFormValues) => a.createRequest(v),
    onSuccess: () => {
      invalidate();
      toast.success("Request added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelRequest() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => a.cancelRequest(id),
    onSuccess: () => {
      invalidate();
      toast.success("Request cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRequest() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => a.deleteRequest(id),
    onSuccess: () => {
      invalidate();
      toast.success("Request deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRule() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (v: AllocationRuleFormValues) => a.updateRule(v),
    onSuccess: () => {
      invalidate();
      toast.success("Rules saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCommitAllocation() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: () => a.commitAllocation(),
    onSuccess: (r) => {
      invalidate();
      toast.success(
        r.allocated > 0
          ? `Allocated ${r.allocated} vehicle${r.allocated === 1 ? "" : "s"} across ${r.requests} request${r.requests === 1 ? "" : "s"}`
          : "Nothing to allocate",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
