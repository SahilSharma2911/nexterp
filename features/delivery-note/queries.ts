"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as dnApi from "./api";
import type { DeliveryNoteFormValues } from "./schema";

export const deliveryNoteKeys = {
  all: ["delivery-notes"] as const,
  lists: () => [...deliveryNoteKeys.all, "list"] as const,
  list: (params: dnApi.DeliveryNotesQuery) =>
    [...deliveryNoteKeys.lists(), params] as const,
  detail: (id: string) => [...deliveryNoteKeys.all, "detail", id] as const,
};

export function useDeliveryNotes(params: dnApi.DeliveryNotesQuery) {
  return useQuery({
    queryKey: deliveryNoteKeys.list(params),
    queryFn: () => dnApi.fetchDeliveryNotes(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeliveryNote(id?: string) {
  return useQuery({
    queryKey: deliveryNoteKeys.detail(id ?? ""),
    queryFn: () => dnApi.fetchDeliveryNote(id as string),
    enabled: !!id,
  });
}

export function useCreateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DeliveryNoteFormValues) =>
      dnApi.createDeliveryNote(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      toast.success("Delivery Note created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: DeliveryNoteFormValues;
    }) => dnApi.updateDeliveryNote(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.detail(row.id) });
      toast.success("Delivery Note updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dnApi.deleteDeliveryNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      toast.success("Delivery Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dnApi.submitDeliveryNote(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.detail(id) });
      toast.success("Delivery submitted — stock issued, COGS posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dnApi.cancelDeliveryNote(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.all });
      qc.invalidateQueries({ queryKey: deliveryNoteKeys.detail(id) });
      toast.success("Delivery cancelled — stock returned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
