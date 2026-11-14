"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as soApi from "./api";
import type { SalesOrderFormValues } from "./schema";

export const salesOrderKeys = {
  all: ["sales-orders"] as const,
  lists: () => [...salesOrderKeys.all, "list"] as const,
  list: (params: soApi.SalesOrdersQuery) =>
    [...salesOrderKeys.lists(), params] as const,
  detail: (id: string) => [...salesOrderKeys.all, "detail", id] as const,
};

export function useSalesOrders(params: soApi.SalesOrdersQuery) {
  return useQuery({
    queryKey: salesOrderKeys.list(params),
    queryFn: () => soApi.fetchSalesOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useSalesOrder(id?: string) {
  return useQuery({
    queryKey: salesOrderKeys.detail(id ?? ""),
    queryFn: () => soApi.fetchSalesOrder(id as string),
    enabled: !!id,
  });
}

export function useSalesOrderPrefill(id?: string) {
  return useQuery({
    queryKey: [...salesOrderKeys.all, "prefill", id ?? ""] as const,
    queryFn: () => soApi.fetchSalesOrderPrefill(id as string),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SalesOrderFormValues) => soApi.createSalesOrder(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesOrderKeys.all });
      toast.success("Sales Order created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SalesOrderFormValues }) =>
      soApi.updateSalesOrder(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: salesOrderKeys.all });
      qc.invalidateQueries({ queryKey: salesOrderKeys.detail(row.id) });
      toast.success("Sales Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => soApi.deleteSalesOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesOrderKeys.all });
      toast.success("Sales Order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => soApi.submitSalesOrder(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: salesOrderKeys.all });
      qc.invalidateQueries({ queryKey: salesOrderKeys.detail(id) });
      toast.success("Sales Order submitted — stock reserved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => soApi.cancelSalesOrder(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: salesOrderKeys.all });
      qc.invalidateQueries({ queryKey: salesOrderKeys.detail(id) });
      toast.success("Sales Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
