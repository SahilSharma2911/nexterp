import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  Dealer,
  DealerAnalytics,
  DealerDetail,
  DealerFormValues,
  DealerOption,
} from "./schema";

export async function fetchDealers(params: ListQuery) {
  const { data } = await api.get<ListResponse<Dealer>>("/dealers", { params });
  return data;
}

export async function fetchDealerOptions() {
  const { data } = await api.get<DealerOption[]>("/dealers/options");
  return data;
}

export async function fetchDealerAnalytics() {
  const { data } = await api.get<DealerAnalytics>("/dealers/analytics");
  return data;
}

export async function fetchDealer(id: string) {
  const { data } = await api.get<Dealer>(`/dealers/${id}`);
  return data;
}

export async function fetchDealerDetail(id: string) {
  const { data } = await api.get<DealerDetail>(`/dealers/${id}/insights`);
  return data;
}

export async function createDealer(values: DealerFormValues) {
  const { data } = await api.post<Dealer>("/dealers", values);
  return data;
}

export async function updateDealer(id: string, values: DealerFormValues) {
  const { data } = await api.patch<Dealer>(`/dealers/${id}`, values);
  return data;
}

export async function deleteDealer(id: string) {
  await api.delete(`/dealers/${id}`);
}
