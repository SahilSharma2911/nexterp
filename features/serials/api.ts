import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  Serial,
  SerialAnalytics,
  SerialFormValues,
  SerialListItem,
} from "./schema";

export type SerialsQuery = ListQuery & { itemId?: string; status?: string };

export async function fetchSerials(params: SerialsQuery) {
  const { data } = await api.get<ListResponse<SerialListItem>>("/serials", {
    params,
  });
  return data;
}

export async function fetchSerialAnalytics() {
  const { data } = await api.get<SerialAnalytics>("/serials/analytics");
  return data;
}

export async function fetchSerial(id: string) {
  const { data } = await api.get<Serial>(`/serials/${id}`);
  return data;
}

export async function fetchSerialsForItem(itemId: string) {
  const { data } = await api.get<ListResponse<SerialListItem>>("/serials", {
    params: { itemId, limit: 200 },
  });
  return data.rows;
}

export async function fetchSerialByBarcode(code: string) {
  const { data } = await api.get<Serial | null>("/serials/by-barcode", {
    params: { code },
  });
  return data;
}

export async function createSerial(values: SerialFormValues) {
  const { data } = await api.post<Serial>("/serials", values);
  return data;
}

export async function updateSerial(id: string, values: SerialFormValues) {
  const { data } = await api.patch<Serial>(`/serials/${id}`, values);
  return data;
}

export async function deleteSerial(id: string) {
  await api.delete(`/serials/${id}`);
}
