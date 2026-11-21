"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as dealersApi from "./api";
import type { DealerFormValues } from "./schema";

export const dealerKeys = {
  all: ["dealers"] as const,
  lists: () => [...dealerKeys.all, "list"] as const,
  list: (params: ListQuery) => [...dealerKeys.lists(), params] as const,
  detail: (id: string) => [...dealerKeys.all, "detail", id] as const,
};

export function useDealers(params: ListQuery) {
  return useQuery({
    queryKey: dealerKeys.list(params),
    queryFn: () => dealersApi.fetchDealers(params),
    placeholderData: keepPreviousData,
  });
}

export function useDealerOptions() {
  return useQuery({
    queryKey: [...dealerKeys.all, "options"] as const,
    queryFn: () => dealersApi.fetchDealerOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useDealer(id?: string) {
  return useQuery({
    queryKey: dealerKeys.detail(id ?? ""),
    queryFn: () => dealersApi.fetchDealer(id as string),
    enabled: !!id,
  });
}

export function useDealerDetail(id?: string) {
  return useQuery({
    queryKey: [...dealerKeys.detail(id ?? ""), "insights"] as const,
    queryFn: () => dealersApi.fetchDealerDetail(id as string),
    enabled: !!id,
  });
}

export function useDealerAnalytics() {
  return useQuery({
    queryKey: [...dealerKeys.all, "analytics"] as const,
    queryFn: () => dealersApi.fetchDealerAnalytics(),
    staleTime: 60_000,
  });
}

export function useCreateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DealerFormValues) => dealersApi.createDealer(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealerKeys.all });
      toast.success("Dealer created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DealerFormValues }) =>
      dealersApi.updateDealer(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: dealerKeys.all });
      qc.setQueryData(dealerKeys.detail(row.id), row);
      toast.success("Dealer updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealersApi.deleteDealer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealerKeys.all });
      toast.success("Dealer deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
