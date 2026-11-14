"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as woApi from "./api";
import type { WorkOrderFormValues } from "./schema";

export const workOrderKeys = {
  all: ["work-orders"] as const,
  lists: () => [...workOrderKeys.all, "list"] as const,
  list: (params: woApi.WorkOrdersQuery) =>
    [...workOrderKeys.lists(), params] as const,
  detail: (id: string) => [...workOrderKeys.all, "detail", id] as const,
};

export function useWorkOrders(params: woApi.WorkOrdersQuery) {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => woApi.fetchWorkOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useWorkOrder(id?: string) {
  return useQuery({
    queryKey: workOrderKeys.detail(id ?? ""),
    queryFn: () => woApi.fetchWorkOrder(id as string),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: WorkOrderFormValues) => woApi.createWorkOrder(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workOrderKeys.all });
      toast.success("Work Order created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFinishWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qty }: { id: string; qty?: number }) =>
      woApi.finishWorkOrder(id, qty),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: workOrderKeys.all });
      qc.invalidateQueries({ queryKey: workOrderKeys.detail(id) });
      toast.success("Production posted — finished goods received");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => woApi.cancelWorkOrder(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: workOrderKeys.all });
      qc.invalidateQueries({ queryKey: workOrderKeys.detail(id) });
      toast.success("Work Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
