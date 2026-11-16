import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  PurchaseInvoiceDetail,
  PurchaseInvoiceFormValues,
  PurchaseInvoiceListItem,
} from "./schema";

export type PurchaseInvoicesQuery = ListQuery & { status: string };

export async function fetchPurchaseInvoices(params: PurchaseInvoicesQuery) {
  const { data } = await api.get<ListResponse<PurchaseInvoiceListItem>>(
    "/purchase-invoices",
    { params },
  );
  return data;
}

export async function fetchPurchaseInvoice(id: string) {
  const { data } = await api.get<PurchaseInvoiceDetail>(`/purchase-invoices/${id}`);
  return data;
}

export async function createPurchaseInvoice(values: PurchaseInvoiceFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/purchase-invoices",
    values,
  );
  return data;
}

export async function updatePurchaseInvoice(
  id: string,
  values: PurchaseInvoiceFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/purchase-invoices/${id}`,
    values,
  );
  return data;
}

export async function deletePurchaseInvoice(id: string) {
  await api.delete(`/purchase-invoices/${id}`);
}

export async function submitPurchaseInvoice(id: string) {
  await api.post(`/purchase-invoices/${id}/submit`);
}

export async function cancelPurchaseInvoice(id: string) {
  await api.post(`/purchase-invoices/${id}/cancel`);
}
