import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  PurchaseOrderDetail,
  PurchaseOrderFormValues,
  PurchaseOrderListItem,
  PurchaseOrderPrefill,
} from "./schema";

export type PurchaseOrdersQuery = ListQuery & { status: string };

export async function fetchPurchaseOrders(params: PurchaseOrdersQuery) {
  const { data } = await api.get<ListResponse<PurchaseOrderListItem>>(
    "/purchase-orders",
    { params },
  );
  return data;
}

export async function fetchPurchaseOrder(id: string) {
  const { data } = await api.get<PurchaseOrderDetail>(`/purchase-orders/${id}`);
  return data;
}

export async function fetchPurchaseOrderPrefill(id: string) {
  const { data } = await api.get<PurchaseOrderPrefill>(
    `/purchase-orders/${id}/prefill`,
  );
  return data;
}

export async function createPurchaseOrder(values: PurchaseOrderFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/purchase-orders",
    values,
  );
  return data;
}

export async function updatePurchaseOrder(
  id: string,
  values: PurchaseOrderFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/purchase-orders/${id}`,
    values,
  );
  return data;
}

export async function deletePurchaseOrder(id: string) {
  await api.delete(`/purchase-orders/${id}`);
}

export async function submitPurchaseOrder(id: string) {
  await api.post(`/purchase-orders/${id}/submit`);
}

export async function cancelPurchaseOrder(id: string) {
  await api.post(`/purchase-orders/${id}/cancel`);
}
