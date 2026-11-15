"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as srApi from "./api";
import type { ReconciliationFormValues } from "./schema";

export const reconKeys = {
  all: ["stock-reconciliations"] as const,
  lists: () => [...reconKeys.all, "list"] as const,
  list: (params: srApi.ReconciliationsQuery) =>
    [...reconKeys.lists(), params] as const,
  detail: (id: string) => [...reconKeys.all, "detail", id] as const,
};

export function useReconciliations(params: srApi.ReconciliationsQuery) {
  return useQuery({
    queryKey: reconKeys.list(params),
    queryFn: () => srApi.fetchReconciliations(params),
    placeholderData: keepPreviousData,
  });
}

export function useReconciliation(id?: string) {
  return useQuery({
    queryKey: reconKeys.detail(id ?? ""),
    queryFn: () => srApi.fetchReconciliation(id as string),
    enabled: !!id,
  });
}

export function useCreateReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ReconciliationFormValues) =>
      srApi.createReconciliation(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reconKeys.all });
      toast.success("Reconciliation created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReconciliationFormValues }) =>
      srApi.updateReconciliation(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: reconKeys.all });
      qc.invalidateQueries({ queryKey: reconKeys.detail(row.id) });
      toast.success("Reconciliation updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => srApi.deleteReconciliation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reconKeys.all });
      toast.success("Reconciliation deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => srApi.submitReconciliation(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: reconKeys.all });
      qc.invalidateQueries({ queryKey: reconKeys.detail(id) });
      toast.success("Reconciliation submitted — stock adjusted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => srApi.cancelReconciliation(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: reconKeys.all });
      qc.invalidateQueries({ queryKey: reconKeys.detail(id) });
      toast.success("Reconciliation cancelled — stock restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
