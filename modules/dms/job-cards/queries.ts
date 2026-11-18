"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as jobsApi from "./api";
import type { JobCardFormValues, JobCardQcValues } from "./schema";

export const jobCardKeys = {
  all: ["job-cards"] as const,
  lists: () => [...jobCardKeys.all, "list"] as const,
  list: (params: jobsApi.JobCardsQuery) =>
    [...jobCardKeys.lists(), params] as const,
  detail: (id: string) => [...jobCardKeys.all, "detail", id] as const,
};

export function useJobCards(params: jobsApi.JobCardsQuery) {
  return useQuery({
    queryKey: jobCardKeys.list(params),
    queryFn: () => jobsApi.fetchJobCards(params),
    placeholderData: keepPreviousData,
  });
}

export function useJobCard(id?: string) {
  return useQuery({
    queryKey: jobCardKeys.detail(id ?? ""),
    queryFn: () => jobsApi.fetchJobCard(id as string),
    enabled: !!id,
  });
}

export function useCreateJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: JobCardFormValues) => jobsApi.createJobCard(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobCardKeys.all });
      toast.success("Job Card created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: JobCardFormValues }) =>
      jobsApi.updateJobCard(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: jobCardKeys.all });
      qc.invalidateQueries({ queryKey: jobCardKeys.detail(row.id) });
      toast.success("Job Card updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJobCard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobCardKeys.all });
      toast.success("Job Card deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCompleteJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.completeJobCard(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: jobCardKeys.all });
      qc.invalidateQueries({ queryKey: jobCardKeys.detail(id) });
      toast.success("Job completed — parts issued & revenue posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelJobCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.cancelJobCard(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: jobCardKeys.all });
      qc.invalidateQueries({ queryKey: jobCardKeys.detail(id) });
      toast.success("Job cancelled — stock & ledger reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecordJobCardQc(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: JobCardQcValues) =>
      jobsApi.recordJobCardQc(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobCardKeys.detail(id) });
      toast.success("Quality check recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
