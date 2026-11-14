import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  BomDetail,
  BomFormValues,
  BomListItem,
  BomOption,
} from "./schema";

export type BomsQuery = ListQuery & { status: string };

export async function fetchBoms(params: BomsQuery) {
  const { data } = await api.get<ListResponse<BomListItem>>("/boms", { params });
  return data;
}

export async function fetchBom(id: string) {
  const { data } = await api.get<BomDetail>(`/boms/${id}`);
  return data;
}

export async function fetchBomOptions() {
  const { data } = await api.get<BomOption[]>("/boms/options");
  return data;
}

export async function createBom(values: BomFormValues) {
  const { data } = await api.post<{ id: string; name: string }>("/boms", values);
  return data;
}

export async function updateBom(id: string, values: BomFormValues) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/boms/${id}`,
    values,
  );
  return data;
}

export async function deleteBom(id: string) {
  await api.delete(`/boms/${id}`);
}

export async function submitBom(id: string) {
  await api.post(`/boms/${id}/submit`);
}

export async function cancelBom(id: string) {
  await api.post(`/boms/${id}/cancel`);
}
