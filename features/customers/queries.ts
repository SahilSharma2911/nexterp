"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as customersApi from "./api";
import type { CustomerFormValues } from "./schema";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: ListQuery) => [...customerKeys.lists(), params] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers(params: ListQuery) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.fetchCustomers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customersApi.fetchCustomer(id as string),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerFormValues) =>
      customersApi.createCustomer(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Customer created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerFormValues }) =>
      customersApi.updateCustomer(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.setQueryData(customerKeys.detail(row.id), row);
      toast.success("Customer updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Customer deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
