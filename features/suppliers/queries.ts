"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as suppliersApi from "./api";
import type { SupplierFormValues } from "./schema";

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params: ListQuery) => [...supplierKeys.lists(), params] as const,
  detail: (id: string) => [...supplierKeys.all, "detail", id] as const,
};

export function useSuppliers(params: ListQuery) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersApi.fetchSuppliers(params),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id?: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id ?? ""),
    queryFn: () => suppliersApi.fetchSupplier(id as string),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SupplierFormValues) =>
      suppliersApi.createSupplier(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast.success("Supplier created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      suppliersApi.updateSupplier(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.setQueryData(supplierKeys.detail(row.id), row);
      toast.success("Supplier updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      toast.success("Supplier deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
