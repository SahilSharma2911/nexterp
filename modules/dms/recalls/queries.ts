"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as recallsApi from "./api";
import type { RecallFormValues, RecallItemStatus } from "./schema";

export const recallKeys = {
  all: ["recalls"] as const,
  lists: () => [...recallKeys.all, "list"] as const,
  list: (p: recallsApi.RecallsQuery) => [...recallKeys.lists(), p] as const,
  detail: (id: string) => [...recallKeys.all, "detail", id] as const,
};

export function useRecalls(params: recallsApi.RecallsQuery) {
  return useQuery({
    queryKey: recallKeys.list(params),
    queryFn: () => recallsApi.fetchRecalls(params),
    placeholderData: keepPreviousData,
  });
}

export function useRecallAnalytics() {
  return useQuery({
    queryKey: [...recallKeys.all, "analytics"] as const,
    queryFn: () => recallsApi.fetchRecallAnalytics(),
    staleTime: 60_000,
  });
}

export function useRecall(id?: string) {
  return useQuery({
    queryKey: recallKeys.detail(id ?? ""),
    queryFn: () => recallsApi.fetchRecall(id as string),
    enabled: !!id,
  });
}

export function useCreateRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: RecallFormValues) => recallsApi.createRecall(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recallKeys.all });
      toast.success("Recall created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecallFormValues }) =>
      recallsApi.updateRecall(id, values),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: recallKeys.all });
      qc.invalidateQueries({ queryKey: recallKeys.detail(id) });
      toast.success("Recall updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recallsApi.deleteRecall(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recallKeys.all });
      toast.success("Recall deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Detail-scoped actions share one invalidation helper.
function useRecallDetailAction<V>(
  fn: (id: string, v: V) => Promise<unknown>,
  msg: (r: unknown) => string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: V }) => fn(id, value),
    onSuccess: (r, { id }) => {
      qc.invalidateQueries({ queryKey: recallKeys.detail(id) });
      qc.invalidateQueries({ queryKey: recallKeys.all });
      toast.success(msg(r));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMatchAffected() {
  return useRecallDetailAction<void>(
    (id) => recallsApi.matchAffected(id),
    (r) => `Matched ${(r as { added: number }).added} affected vehicle(s)`,
  );
}

export function useAddVehicleToRecall() {
  return useRecallDetailAction<string>(
    (id, vehicleId) => recallsApi.addVehicleToRecall(id, vehicleId),
    () => "Vehicle added",
  );
}

export function useSetRecallStatus() {
  return useRecallDetailAction<"OPEN" | "CLOSED">(
    (id, status) => recallsApi.setRecallStatus(id, status),
    () => "Recall updated",
  );
}

// Item-level mutations invalidate the parent campaign detail.
export function useSetItemStatus(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      status,
      body,
    }: {
      itemId: string;
      status: RecallItemStatus;
      body?: { jobCardId?: string | null; notes?: string | null };
    }) => recallsApi.setItemStatus(itemId, status, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recallKeys.detail(campaignId) });
      qc.invalidateQueries({ queryKey: recallKeys.all });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveRecallItem(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => recallsApi.removeRecallItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recallKeys.detail(campaignId) });
      qc.invalidateQueries({ queryKey: recallKeys.all });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
