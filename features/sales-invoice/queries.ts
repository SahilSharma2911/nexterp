"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as siApi from "./api";
import type { SalesInvoiceFormValues } from "./schema";

export const salesInvoiceKeys = {
  all: ["sales-invoices"] as const,
  lists: () => [...salesInvoiceKeys.all, "list"] as const,
  list: (params: siApi.SalesInvoicesQuery) =>
    [...salesInvoiceKeys.lists(), params] as const,
  detail: (id: string) => [...salesInvoiceKeys.all, "detail", id] as const,
};

export function useSalesInvoices(params: siApi.SalesInvoicesQuery) {
  return useQuery({
    queryKey: salesInvoiceKeys.list(params),
    queryFn: () => siApi.fetchSalesInvoices(params),
    placeholderData: keepPreviousData,
  });
}

export function useSalesInvoice(id?: string) {
  return useQuery({
    queryKey: salesInvoiceKeys.detail(id ?? ""),
    queryFn: () => siApi.fetchSalesInvoice(id as string),
    enabled: !!id,
  });
}

export function useCreateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SalesInvoiceFormValues) =>
      siApi.createSalesInvoice(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      toast.success("Sales Invoice created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: SalesInvoiceFormValues;
    }) => siApi.updateSalesInvoice(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.detail(row.id) });
      toast.success("Sales Invoice updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siApi.deleteSalesInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      toast.success("Sales Invoice deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siApi.submitSalesInvoice(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.detail(id) });
      toast.success("Sales Invoice submitted — ledger posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => siApi.cancelSalesInvoice(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      qc.invalidateQueries({ queryKey: salesInvoiceKeys.detail(id) });
      toast.success("Sales Invoice cancelled — ledger reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
