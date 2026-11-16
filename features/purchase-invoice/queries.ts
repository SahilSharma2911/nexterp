"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as piApi from "./api";
import type { PurchaseInvoiceFormValues } from "./schema";

export const purchaseInvoiceKeys = {
  all: ["purchase-invoices"] as const,
  lists: () => [...purchaseInvoiceKeys.all, "list"] as const,
  list: (params: piApi.PurchaseInvoicesQuery) =>
    [...purchaseInvoiceKeys.lists(), params] as const,
  detail: (id: string) => [...purchaseInvoiceKeys.all, "detail", id] as const,
};

export function usePurchaseInvoices(params: piApi.PurchaseInvoicesQuery) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.list(params),
    queryFn: () => piApi.fetchPurchaseInvoices(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseInvoice(id?: string) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.detail(id ?? ""),
    queryFn: () => piApi.fetchPurchaseInvoice(id as string),
    enabled: !!id,
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PurchaseInvoiceFormValues) =>
      piApi.createPurchaseInvoice(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      toast.success("Purchase Invoice created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: PurchaseInvoiceFormValues;
    }) => piApi.updatePurchaseInvoice(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(row.id) });
      toast.success("Purchase Invoice updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => piApi.deletePurchaseInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      toast.success("Purchase Invoice deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitPurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => piApi.submitPurchaseInvoice(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(id) });
      toast.success("Purchase Invoice submitted — ledger posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelPurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => piApi.cancelPurchaseInvoice(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: purchaseInvoiceKeys.detail(id) });
      toast.success("Purchase Invoice cancelled — ledger reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
