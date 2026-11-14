"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as warehousesApi from "./api";
import type { WarehouseFormValues } from "./schema";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  list: (params: ListQuery) => [...warehouseKeys.lists(), params] as const,
  detail: (id: string) => [...warehouseKeys.all, "detail", id] as const,
};

export function useWarehouses(params: ListQuery) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehousesApi.fetchWarehouses(params),
    placeholderData: keepPreviousData,
  });
}

export function useWarehouseOptions() {
  return useQuery({
    queryKey: [...warehouseKeys.all, "options"] as const,
    queryFn: () => warehousesApi.fetchWarehouseOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useWarehouse(id?: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ""),
    queryFn: () => warehousesApi.fetchWarehouse(id as string),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: WarehouseFormValues) =>
      warehousesApi.createWarehouse(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success("Warehouse created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WarehouseFormValues }) =>
      warehousesApi.updateWarehouse(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      qc.setQueryData(warehouseKeys.detail(row.id), row);
      toast.success("Warehouse updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesApi.deleteWarehouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success("Warehouse deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
