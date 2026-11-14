"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as prApi from "./api";
import type { PurchaseReceiptFormValues } from "./schema";

export const purchaseReceiptKeys = {
  all: ["purchase-receipts"] as const,
  lists: () => [...purchaseReceiptKeys.all, "list"] as const,
  list: (params: prApi.PurchaseReceiptsQuery) =>
    [...purchaseReceiptKeys.lists(), params] as const,
  detail: (id: string) => [...purchaseReceiptKeys.all, "detail", id] as const,
};

export function usePurchaseReceipts(params: prApi.PurchaseReceiptsQuery) {
  return useQuery({
    queryKey: purchaseReceiptKeys.list(params),
    queryFn: () => prApi.fetchPurchaseReceipts(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseReceipt(id?: string) {
  return useQuery({
    queryKey: purchaseReceiptKeys.detail(id ?? ""),
    queryFn: () => prApi.fetchPurchaseReceipt(id as string),
    enabled: !!id,
  });
}

export function useCreatePurchaseReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PurchaseReceiptFormValues) =>
      prApi.createPurchaseReceipt(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.all });
      toast.success("Purchase Receipt created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePurchaseReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: PurchaseReceiptFormValues;
    }) => prApi.updatePurchaseReceipt(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.all });
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.detail(row.id) });
      toast.success("Purchase Receipt updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePurchaseReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prApi.deletePurchaseReceipt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.all });
      toast.success("Purchase Receipt deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitPurchaseReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prApi.submitPurchaseReceipt(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.all });
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.detail(id) });
      toast.success("Receipt submitted — stock received");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelPurchaseReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prApi.cancelPurchaseReceipt(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.all });
      qc.invalidateQueries({ queryKey: purchaseReceiptKeys.detail(id) });
      toast.success("Receipt cancelled — stock reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
