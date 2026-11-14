"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as bomApi from "./api";
import type { BomFormValues } from "./schema";

export const bomKeys = {
  all: ["boms"] as const,
  lists: () => [...bomKeys.all, "list"] as const,
  list: (params: bomApi.BomsQuery) => [...bomKeys.lists(), params] as const,
  options: () => [...bomKeys.all, "options"] as const,
  detail: (id: string) => [...bomKeys.all, "detail", id] as const,
};

export function useBoms(params: bomApi.BomsQuery) {
  return useQuery({
    queryKey: bomKeys.list(params),
    queryFn: () => bomApi.fetchBoms(params),
    placeholderData: keepPreviousData,
  });
}

export function useBom(id?: string) {
  return useQuery({
    queryKey: bomKeys.detail(id ?? ""),
    queryFn: () => bomApi.fetchBom(id as string),
    enabled: !!id,
  });
}

export function useBomOptions() {
  return useQuery({
    queryKey: bomKeys.options(),
    queryFn: () => bomApi.fetchBomOptions(),
    staleTime: 60_000,
  });
}

export function useCreateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BomFormValues) => bomApi.createBom(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      toast.success("BOM created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BomFormValues }) =>
      bomApi.updateBom(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      qc.invalidateQueries({ queryKey: bomKeys.detail(row.id) });
      toast.success("BOM updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bomApi.deleteBom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      toast.success("BOM deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bomApi.submitBom(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      qc.invalidateQueries({ queryKey: bomKeys.detail(id) });
      toast.success("BOM submitted — exploded to raw materials");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bomApi.cancelBom(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      qc.invalidateQueries({ queryKey: bomKeys.detail(id) });
      toast.success("BOM cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
