"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as warrantiesApi from "./api";
import type { WarrantyFormValues } from "./schema";

export const warrantyKeys = {
  all: ["warranties"] as const,
  lists: () => [...warrantyKeys.all, "list"] as const,
  list: (params: warrantiesApi.WarrantiesQuery) =>
    [...warrantyKeys.lists(), params] as const,
  detail: (id: string) => [...warrantyKeys.all, "detail", id] as const,
};

export function useWarranties(params: warrantiesApi.WarrantiesQuery) {
  return useQuery({
    queryKey: warrantyKeys.list(params),
    queryFn: () => warrantiesApi.fetchWarranties(params),
    placeholderData: keepPreviousData,
  });
}

export function useWarrantyAnalytics() {
  return useQuery({
    queryKey: [...warrantyKeys.all, "analytics"] as const,
    queryFn: () => warrantiesApi.fetchWarrantyAnalytics(),
    staleTime: 60_000,
  });
}

export function useWarrantyInsights() {
  return useQuery({
    queryKey: [...warrantyKeys.all, "insights"] as const,
    queryFn: () => warrantiesApi.fetchWarrantyInsights(),
    staleTime: 60_000,
  });
}

export function useWarrantyOptions(vehicleId?: string) {
  return useQuery({
    queryKey: [...warrantyKeys.all, "options", vehicleId ?? ""] as const,
    queryFn: () => warrantiesApi.fetchWarrantyOptions(vehicleId),
    staleTime: 5 * 60_000,
  });
}

export function useWarranty(id?: string) {
  return useQuery({
    queryKey: warrantyKeys.detail(id ?? ""),
    queryFn: () => warrantiesApi.fetchWarranty(id as string),
    enabled: !!id,
  });
}

export function useVehicleRegistration(vehicleId?: string) {
  return useQuery({
    queryKey: [...warrantyKeys.all, "registration", vehicleId ?? ""] as const,
    queryFn: () => warrantiesApi.fetchVehicleRegistration(vehicleId as string),
    enabled: !!vehicleId,
  });
}

export function useRegisterSaleCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) =>
      warrantiesApi.registerSaleCoverage(vehicleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warrantyKeys.all });
      toast.success("Warranty coverage registered");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: WarrantyFormValues) =>
      warrantiesApi.createWarranty(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warrantyKeys.all });
      toast.success("Warranty created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WarrantyFormValues }) =>
      warrantiesApi.updateWarranty(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: warrantyKeys.all });
      qc.setQueryData(warrantyKeys.detail(row.id), row);
      toast.success("Warranty updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warrantiesApi.deleteWarranty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warrantyKeys.all });
      toast.success("Warranty deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
