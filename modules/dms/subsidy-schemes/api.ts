import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type { SchemeFormValues, SchemeOption, SubsidyScheme } from "./schema";

export type SchemesQuery = ListQuery & { status: string };

export async function fetchSchemes(params: SchemesQuery) {
  const { data } = await api.get<ListResponse<SubsidyScheme>>(
    "/subsidy-schemes",
    { params },
  );
  return data;
}

export async function fetchSchemeOptions() {
  const { data } = await api.get<SchemeOption[]>("/subsidy-schemes/options");
  return data;
}

export async function fetchScheme(id: string) {
  const { data } = await api.get<SubsidyScheme>(`/subsidy-schemes/${id}`);
  return data;
}

export async function createScheme(values: SchemeFormValues) {
  const { data } = await api.post<SubsidyScheme>("/subsidy-schemes", values);
  return data;
}

export async function updateScheme(id: string, values: SchemeFormValues) {
  const { data } = await api.patch<SubsidyScheme>(
    `/subsidy-schemes/${id}`,
    values,
  );
  return data;
}

export async function deleteScheme(id: string) {
  await api.delete(`/subsidy-schemes/${id}`);
}
