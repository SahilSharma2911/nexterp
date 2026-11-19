"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as vehiclesApi from "./api";
import type { VehicleFormValues } from "./schema";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (params: vehiclesApi.VehiclesQuery) =>
    [...vehicleKeys.lists(), params] as const,
  detail: (id: string) => [...vehicleKeys.all, "detail", id] as const,
};

export function useVehicles(params: vehiclesApi.VehiclesQuery) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehiclesApi.fetchVehicles(params),
    placeholderData: keepPreviousData,
  });
}

export function useVehicleOptions() {
  return useQuery({
    queryKey: [...vehicleKeys.all, "options"] as const,
    queryFn: () => vehiclesApi.fetchVehicleOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useVehicleAnalytics() {
  return useQuery({
    queryKey: [...vehicleKeys.all, "analytics"] as const,
    queryFn: () => vehiclesApi.fetchVehicleAnalytics(),
    staleTime: 60_000,
  });
}

export function useVehicle(id?: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id ?? ""),
    queryFn: () => vehiclesApi.fetchVehicle(id as string),
    enabled: !!id,
  });
}

export function useVehicleRelated(id?: string) {
  return useQuery({
    queryKey: [...vehicleKeys.detail(id ?? ""), "related"] as const,
    queryFn: () => vehiclesApi.fetchVehicleRelated(id as string),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: VehicleFormValues) => vehiclesApi.createVehicle(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success("Vehicle added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: VehicleFormValues }) =>
      vehiclesApi.updateVehicle(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      qc.setQueryData(vehicleKeys.detail(row.id), row);
      toast.success("Vehicle updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success("Vehicle deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
