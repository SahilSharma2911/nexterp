import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  DeliveryNoteDetail,
  DeliveryNoteFormValues,
  DeliveryNoteListItem,
} from "./schema";

export type DeliveryNotesQuery = ListQuery & { status: string };

export async function fetchDeliveryNotes(params: DeliveryNotesQuery) {
  const { data } = await api.get<ListResponse<DeliveryNoteListItem>>(
    "/delivery-notes",
    { params },
  );
  return data;
}

export async function fetchDeliveryNote(id: string) {
  const { data } = await api.get<DeliveryNoteDetail>(`/delivery-notes/${id}`);
  return data;
}

export async function createDeliveryNote(values: DeliveryNoteFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/delivery-notes",
    values,
  );
  return data;
}

export async function updateDeliveryNote(
  id: string,
  values: DeliveryNoteFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/delivery-notes/${id}`,
    values,
  );
  return data;
}

export async function deleteDeliveryNote(id: string) {
  await api.delete(`/delivery-notes/${id}`);
}

export async function submitDeliveryNote(id: string) {
  await api.post(`/delivery-notes/${id}/submit`);
}

export async function cancelDeliveryNote(id: string) {
  await api.post(`/delivery-notes/${id}/cancel`);
}
