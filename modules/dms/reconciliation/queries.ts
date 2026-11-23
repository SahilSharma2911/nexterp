"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as reconApi from "./api";
import type { CreditNoteFormValues } from "./schema";

export const reconKeys = {
  all: ["credit-notes"] as const,
  list: (p: reconApi.CreditNotesQuery) => [...reconKeys.all, "list", p] as const,
  summary: () => [...reconKeys.all, "summary"] as const,
  claimOptions: () => [...reconKeys.all, "claim-options"] as const,
};

export function useCreditNotes(params: reconApi.CreditNotesQuery) {
  return useQuery({
    queryKey: reconKeys.list(params),
    queryFn: () => reconApi.fetchCreditNotes(params),
    placeholderData: keepPreviousData,
  });
}

export function useReconciliation() {
  return useQuery({
    queryKey: reconKeys.summary(),
    queryFn: () => reconApi.fetchReconciliation(),
    staleTime: 60_000,
  });
}

export function useClaimReconOptions() {
  return useQuery({
    queryKey: reconKeys.claimOptions(),
    queryFn: () => reconApi.fetchClaimReconOptions(),
    staleTime: 60_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: reconKeys.all });
    qc.invalidateQueries({ queryKey: ["warranty-claims"] });
  };
}

export function useCreateCreditNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: CreditNoteFormValues) =>
      reconApi.createCreditNote(values),
    onSuccess: () => {
      invalidate();
      toast.success("Credit note added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCreditNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CreditNoteFormValues }) =>
      reconApi.updateCreditNote(id, values),
    onSuccess: () => {
      invalidate();
      toast.success("Credit note updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCreditNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => reconApi.deleteCreditNote(id),
    onSuccess: () => {
      invalidate();
      toast.success("Credit note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMatchCreditNote() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, claimId }: { id: string; claimId: string | null }) =>
      reconApi.matchCreditNote(id, claimId),
    onSuccess: () => {
      invalidate();
      toast.success("Credit note matched");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
