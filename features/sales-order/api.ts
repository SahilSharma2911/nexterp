import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  SalesOrderDetail,
  SalesOrderFormValues,
  SalesOrderListItem,
  SalesOrderPrefill,
} from "./schema";

export type SalesOrdersQuery = ListQuery & { status: string };

export async function fetchSalesOrders(params: SalesOrdersQuery) {
  const { data } = await api.get<ListResponse<SalesOrderListItem>>(
    "/sales-orders",
    { params },
  );
  return data;
}

export async function fetchSalesOrder(id: string) {
  const { data } = await api.get<SalesOrderDetail>(`/sales-orders/${id}`);
  return data;
}

export async function fetchSalesOrderPrefill(id: string) {
  const { data } = await api.get<SalesOrderPrefill>(
    `/sales-orders/${id}/prefill`,
  );
  return data;
}

export async function createSalesOrder(values: SalesOrderFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/sales-orders",
    values,
  );
  return data;
}

export async function updateSalesOrder(
  id: string,
  values: SalesOrderFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/sales-orders/${id}`,
    values,
  );
  return data;
}

export async function deleteSalesOrder(id: string) {
  await api.delete(`/sales-orders/${id}`);
}

export async function submitSalesOrder(id: string) {
  await api.post(`/sales-orders/${id}/submit`);
}

export async function cancelSalesOrder(id: string) {
  await api.post(`/sales-orders/${id}/cancel`);
}
