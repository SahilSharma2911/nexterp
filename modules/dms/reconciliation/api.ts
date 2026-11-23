import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  ClaimReconOption,
  CreditNoteFormValues,
  CreditNoteRow,
  ReconciliationSummary,
} from "./schema";

export type CreditNotesQuery = ListQuery & { status?: string };

export async function fetchCreditNotes(params: CreditNotesQuery) {
  const { data } = await api.get<ListResponse<CreditNoteRow>>("/credit-notes", {
    params,
  });
  return data;
}

export async function fetchReconciliation() {
  const { data } = await api.get<ReconciliationSummary>(
    "/credit-notes/reconciliation",
  );
  return data;
}

export async function fetchClaimReconOptions() {
  const { data } = await api.get<ClaimReconOption[]>(
    "/credit-notes/claim-options",
  );
  return data;
}

export async function createCreditNote(values: CreditNoteFormValues) {
  const { data } = await api.post<{ id: string }>("/credit-notes", values);
  return data;
}

export async function updateCreditNote(id: string, values: CreditNoteFormValues) {
  const { data } = await api.patch<{ id: string }>(`/credit-notes/${id}`, values);
  return data;
}

export async function deleteCreditNote(id: string) {
  await api.delete(`/credit-notes/${id}`);
}

export async function matchCreditNote(id: string, claimId: string | null) {
  await api.post(`/credit-notes/${id}/match`, { claimId });
}
