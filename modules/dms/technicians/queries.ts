"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as techApi from "./api";
import type { TechnicianFormValues } from "./schema";

export const technicianKeys = {
  all: ["technicians"] as const,
  lists: () => [...technicianKeys.all, "list"] as const,
  list: (params: ListQuery) => [...technicianKeys.lists(), params] as const,
  detail: (id: string) => [...technicianKeys.all, "detail", id] as const,
};

export function useTechnicians(params: ListQuery) {
  return useQuery({
    queryKey: technicianKeys.list(params),
    queryFn: () => techApi.fetchTechnicians(params),
    placeholderData: keepPreviousData,
  });
}

export function useTechnicianOptions() {
  return useQuery({
    queryKey: [...technicianKeys.all, "options"] as const,
    queryFn: () => techApi.fetchTechnicianOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useTechnician(id?: string) {
  return useQuery({
    queryKey: technicianKeys.detail(id ?? ""),
    queryFn: () => techApi.fetchTechnician(id as string),
    enabled: !!id,
  });
}

export function useTechnicianAnalytics() {
  return useQuery({
    queryKey: [...technicianKeys.all, "analytics"] as const,
    queryFn: () => techApi.fetchTechnicianAnalytics(),
    staleTime: 60_000,
  });
}

export function useTechnicianDetail(id?: string) {
  return useQuery({
    queryKey: [...technicianKeys.detail(id ?? ""), "insights"] as const,
    queryFn: () => techApi.fetchTechnicianDetail(id as string),
    enabled: !!id,
  });
}

export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: TechnicianFormValues) =>
      techApi.createTechnician(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: technicianKeys.all });
      toast.success("Technician created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TechnicianFormValues }) =>
      techApi.updateTechnician(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: technicianKeys.all });
      qc.setQueryData(technicianKeys.detail(row.id), row);
      toast.success("Technician updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => techApi.deleteTechnician(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: technicianKeys.all });
      toast.success("Technician deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
