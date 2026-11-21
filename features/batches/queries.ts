"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as batchApi from "./api";
import type { BatchFormValues } from "./schema";

export const batchKeys = {
  all: ["batches"] as const,
  lists: () => [...batchKeys.all, "list"] as const,
  list: (params: batchApi.BatchesQuery) =>
    [...batchKeys.lists(), params] as const,
  detail: (id: string) => [...batchKeys.all, "detail", id] as const,
  forItem: (itemId: string) => [...batchKeys.all, "item", itemId] as const,
};

export function useBatches(params: batchApi.BatchesQuery) {
  return useQuery({
    queryKey: batchKeys.list(params),
    queryFn: () => batchApi.fetchBatches(params),
    placeholderData: keepPreviousData,
  });
}

export function useBatchAnalytics() {
  return useQuery({
    queryKey: [...batchKeys.all, "analytics"] as const,
    queryFn: () => batchApi.fetchBatchAnalytics(),
    staleTime: 60_000,
  });
}

export function useBatch(id?: string) {
  return useQuery({
    queryKey: batchKeys.detail(id ?? ""),
    queryFn: () => batchApi.fetchBatch(id as string),
    enabled: !!id,
  });
}

export function useBatchesForItem(itemId?: string) {
  return useQuery({
    queryKey: batchKeys.forItem(itemId ?? ""),
    queryFn: () => batchApi.fetchBatchesForItem(itemId as string),
    enabled: !!itemId,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BatchFormValues) => batchApi.createBatch(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
      toast.success("Batch created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BatchFormValues }) =>
      batchApi.updateBatch(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
      qc.setQueryData(batchKeys.detail(row.id), row);
      toast.success("Batch updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchApi.deleteBatch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: batchKeys.all });
      toast.success("Batch deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
