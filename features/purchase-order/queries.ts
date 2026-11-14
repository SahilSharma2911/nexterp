"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as poApi from "./api";
import type { PurchaseOrderFormValues } from "./schema";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (params: poApi.PurchaseOrdersQuery) =>
    [...purchaseOrderKeys.lists(), params] as const,
  detail: (id: string) => [...purchaseOrderKeys.all, "detail", id] as const,
};

export function usePurchaseOrders(params: poApi.PurchaseOrdersQuery) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => poApi.fetchPurchaseOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id ?? ""),
    queryFn: () => poApi.fetchPurchaseOrder(id as string),
    enabled: !!id,
  });
}

export function usePurchaseOrderPrefill(id?: string) {
  return useQuery({
    queryKey: [...purchaseOrderKeys.all, "prefill", id ?? ""] as const,
    queryFn: () => poApi.fetchPurchaseOrderPrefill(id as string),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PurchaseOrderFormValues) =>
      poApi.createPurchaseOrder(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success("Purchase Order created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PurchaseOrderFormValues }) =>
      poApi.updatePurchaseOrder(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.detail(row.id) });
      toast.success("Purchase Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => poApi.deletePurchaseOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success("Purchase Order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => poApi.submitPurchaseOrder(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      toast.success("Purchase Order submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => poApi.cancelPurchaseOrder(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      toast.success("Purchase Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
