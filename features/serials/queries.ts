"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as serialApi from "./api";
import type { SerialFormValues } from "./schema";

export const serialKeys = {
  all: ["serials"] as const,
  lists: () => [...serialKeys.all, "list"] as const,
  list: (params: serialApi.SerialsQuery) =>
    [...serialKeys.lists(), params] as const,
  detail: (id: string) => [...serialKeys.all, "detail", id] as const,
  forItem: (itemId: string) => [...serialKeys.all, "item", itemId] as const,
};

export function useSerials(params: serialApi.SerialsQuery) {
  return useQuery({
    queryKey: serialKeys.list(params),
    queryFn: () => serialApi.fetchSerials(params),
    placeholderData: keepPreviousData,
  });
}

export function useSerialAnalytics() {
  return useQuery({
    queryKey: [...serialKeys.all, "analytics"] as const,
    queryFn: () => serialApi.fetchSerialAnalytics(),
    staleTime: 60_000,
  });
}

export function useSerial(id?: string) {
  return useQuery({
    queryKey: serialKeys.detail(id ?? ""),
    queryFn: () => serialApi.fetchSerial(id as string),
    enabled: !!id,
  });
}

export function useSerialsForItem(itemId?: string) {
  return useQuery({
    queryKey: serialKeys.forItem(itemId ?? ""),
    queryFn: () => serialApi.fetchSerialsForItem(itemId as string),
    enabled: !!itemId,
  });
}

export function useCreateSerial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SerialFormValues) => serialApi.createSerial(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serialKeys.all });
      toast.success("Serial created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSerial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SerialFormValues }) =>
      serialApi.updateSerial(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: serialKeys.all });
      qc.setQueryData(serialKeys.detail(row.id), row);
      toast.success("Serial updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSerial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serialApi.deleteSerial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serialKeys.all });
      toast.success("Serial deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
