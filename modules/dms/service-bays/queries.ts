"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as bayApi from "./api";
import type { ServiceBayFormValues } from "./schema";

export const serviceBayKeys = {
  all: ["service-bays"] as const,
  lists: () => [...serviceBayKeys.all, "list"] as const,
  list: (params: ListQuery) => [...serviceBayKeys.lists(), params] as const,
  detail: (id: string) => [...serviceBayKeys.all, "detail", id] as const,
};

export function useServiceBays(params: ListQuery) {
  return useQuery({
    queryKey: serviceBayKeys.list(params),
    queryFn: () => bayApi.fetchServiceBays(params),
    placeholderData: keepPreviousData,
  });
}

export function useServiceBayOptions() {
  return useQuery({
    queryKey: [...serviceBayKeys.all, "options"] as const,
    queryFn: () => bayApi.fetchServiceBayOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useServiceBay(id?: string) {
  return useQuery({
    queryKey: serviceBayKeys.detail(id ?? ""),
    queryFn: () => bayApi.fetchServiceBay(id as string),
    enabled: !!id,
  });
}

export function useCreateServiceBay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ServiceBayFormValues) =>
      bayApi.createServiceBay(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceBayKeys.all });
      toast.success("Service bay created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateServiceBay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceBayFormValues }) =>
      bayApi.updateServiceBay(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: serviceBayKeys.all });
      qc.setQueryData(serviceBayKeys.detail(row.id), row);
      toast.success("Service bay updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteServiceBay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bayApi.deleteServiceBay(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceBayKeys.all });
      toast.success("Service bay deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
