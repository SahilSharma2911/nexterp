"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as itemsApi from "./api";
import type { ItemFormValues } from "./schema";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (params: itemsApi.ItemsQuery) => [...itemKeys.lists(), params] as const,
  detail: (id: string) => [...itemKeys.all, "detail", id] as const,
};

export function useItems(params: itemsApi.ItemsQuery) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => itemsApi.fetchItems(params),
    placeholderData: keepPreviousData,
  });
}

export function useItem(id?: string) {
  return useQuery({
    queryKey: itemKeys.detail(id ?? ""),
    queryFn: () => itemsApi.fetchItem(id as string),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ItemFormValues) => itemsApi.createItem(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.all });
      toast.success("Item created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ItemFormValues }) =>
      itemsApi.updateItem(id, values),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: itemKeys.all });
      qc.setQueryData(itemKeys.detail(item.id), item);
      toast.success("Item updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.all });
      toast.success("Item deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
