import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  SalesInvoiceDetail,
  SalesInvoiceFormValues,
  SalesInvoiceListItem,
} from "./schema";

export type SalesInvoicesQuery = ListQuery & { status: string };

export async function fetchSalesInvoices(params: SalesInvoicesQuery) {
  const { data } = await api.get<ListResponse<SalesInvoiceListItem>>(
    "/sales-invoices",
    { params },
  );
  return data;
}

export async function fetchSalesInvoice(id: string) {
  const { data } = await api.get<SalesInvoiceDetail>(`/sales-invoices/${id}`);
  return data;
}

export async function createSalesInvoice(values: SalesInvoiceFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/sales-invoices",
    values,
  );
  return data;
}

export async function updateSalesInvoice(
  id: string,
  values: SalesInvoiceFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/sales-invoices/${id}`,
    values,
  );
  return data;
}

export async function deleteSalesInvoice(id: string) {
  await api.delete(`/sales-invoices/${id}`);
}

export async function submitSalesInvoice(id: string) {
  await api.post(`/sales-invoices/${id}/submit`);
}

export async function cancelSalesInvoice(id: string) {
  await api.post(`/sales-invoices/${id}/cancel`);
}
