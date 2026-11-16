import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  PaymentEntryDetail,
  PaymentEntryFormValues,
  PaymentEntryListItem,
} from "./schema";

export type PaymentEntriesQuery = ListQuery & { status: string; type: string };

export async function fetchPaymentEntries(params: PaymentEntriesQuery) {
  const { data } = await api.get<ListResponse<PaymentEntryListItem>>(
    "/payment-entries",
    { params },
  );
  return data;
}

export async function fetchPaymentEntry(id: string) {
  const { data } = await api.get<PaymentEntryDetail>(`/payment-entries/${id}`);
  return data;
}

export async function createPaymentEntry(values: PaymentEntryFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/payment-entries",
    values,
  );
  return data;
}

export async function updatePaymentEntry(
  id: string,
  values: PaymentEntryFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/payment-entries/${id}`,
    values,
  );
  return data;
}

export async function deletePaymentEntry(id: string) {
  await api.delete(`/payment-entries/${id}`);
}

export async function submitPaymentEntry(id: string) {
  await api.post(`/payment-entries/${id}/submit`);
}

export async function cancelPaymentEntry(id: string) {
  await api.post(`/payment-entries/${id}/cancel`);
}
