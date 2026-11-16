"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as peApi from "./api";
import type { PaymentEntryFormValues } from "./schema";

export const paymentEntryKeys = {
  all: ["payment-entries"] as const,
  lists: () => [...paymentEntryKeys.all, "list"] as const,
  list: (params: peApi.PaymentEntriesQuery) =>
    [...paymentEntryKeys.lists(), params] as const,
  detail: (id: string) => [...paymentEntryKeys.all, "detail", id] as const,
};

export function usePaymentEntries(params: peApi.PaymentEntriesQuery) {
  return useQuery({
    queryKey: paymentEntryKeys.list(params),
    queryFn: () => peApi.fetchPaymentEntries(params),
    placeholderData: keepPreviousData,
  });
}

export function usePaymentEntry(id?: string) {
  return useQuery({
    queryKey: paymentEntryKeys.detail(id ?? ""),
    queryFn: () => peApi.fetchPaymentEntry(id as string),
    enabled: !!id,
  });
}

export function useCreatePaymentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PaymentEntryFormValues) =>
      peApi.createPaymentEntry(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentEntryKeys.all });
      toast.success("Payment Entry created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePaymentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: PaymentEntryFormValues;
    }) => peApi.updatePaymentEntry(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: paymentEntryKeys.all });
      qc.invalidateQueries({ queryKey: paymentEntryKeys.detail(row.id) });
      toast.success("Payment Entry updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePaymentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peApi.deletePaymentEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentEntryKeys.all });
      toast.success("Payment Entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitPaymentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peApi.submitPaymentEntry(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: paymentEntryKeys.all });
      qc.invalidateQueries({ queryKey: paymentEntryKeys.detail(id) });
      toast.success("Payment submitted — ledger posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelPaymentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peApi.cancelPaymentEntry(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: paymentEntryKeys.all });
      qc.invalidateQueries({ queryKey: paymentEntryKeys.detail(id) });
      toast.success("Payment cancelled — ledger reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
