"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as schemesApi from "./api";
import type { SchemeFormValues } from "./schema";

export const schemeKeys = {
  all: ["subsidy-schemes"] as const,
  lists: () => [...schemeKeys.all, "list"] as const,
  list: (params: schemesApi.SchemesQuery) =>
    [...schemeKeys.lists(), params] as const,
  detail: (id: string) => [...schemeKeys.all, "detail", id] as const,
};

export function useSchemes(params: schemesApi.SchemesQuery) {
  return useQuery({
    queryKey: schemeKeys.list(params),
    queryFn: () => schemesApi.fetchSchemes(params),
    placeholderData: keepPreviousData,
  });
}

export function useSchemeOptions() {
  return useQuery({
    queryKey: [...schemeKeys.all, "options"] as const,
    queryFn: () => schemesApi.fetchSchemeOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useScheme(id?: string) {
  return useQuery({
    queryKey: schemeKeys.detail(id ?? ""),
    queryFn: () => schemesApi.fetchScheme(id as string),
    enabled: !!id,
  });
}

export function useCreateScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SchemeFormValues) => schemesApi.createScheme(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schemeKeys.all });
      toast.success("Scheme created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SchemeFormValues }) =>
      schemesApi.updateScheme(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: schemeKeys.all });
      qc.setQueryData(schemeKeys.detail(row.id), row);
      toast.success("Scheme updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schemesApi.deleteScheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schemeKeys.all });
      toast.success("Scheme deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
