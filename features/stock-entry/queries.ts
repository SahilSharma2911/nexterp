"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as seApi from "./api";
import type { StockEntryFormValues } from "./schema";

export const stockEntryKeys = {
  all: ["stock-entries"] as const,
  lists: () => [...stockEntryKeys.all, "list"] as const,
  list: (params: seApi.StockEntriesQuery) =>
    [...stockEntryKeys.lists(), params] as const,
  detail: (id: string) => [...stockEntryKeys.all, "detail", id] as const,
};

export function useStockEntries(params: seApi.StockEntriesQuery) {
  return useQuery({
    queryKey: stockEntryKeys.list(params),
    queryFn: () => seApi.fetchStockEntries(params),
    placeholderData: keepPreviousData,
  });
}

export function useStockEntry(id?: string) {
  return useQuery({
    queryKey: stockEntryKeys.detail(id ?? ""),
    queryFn: () => seApi.fetchStockEntry(id as string),
    enabled: !!id,
  });
}

export function useCreateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: StockEntryFormValues) => seApi.createStockEntry(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockEntryKeys.all });
      toast.success("Stock Entry created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StockEntryFormValues }) =>
      seApi.updateStockEntry(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: stockEntryKeys.all });
      qc.invalidateQueries({ queryKey: stockEntryKeys.detail(row.id) });
      toast.success("Stock Entry updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seApi.deleteStockEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockEntryKeys.all });
      toast.success("Stock Entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seApi.submitStockEntry(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: stockEntryKeys.all });
      qc.invalidateQueries({ queryKey: stockEntryKeys.detail(id) });
      toast.success("Stock Entry submitted — stock ledger posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seApi.cancelStockEntry(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: stockEntryKeys.all });
      qc.invalidateQueries({ queryKey: stockEntryKeys.detail(id) });
      toast.success("Stock Entry cancelled — ledger reversed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
