import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  WorkOrderDetail,
  WorkOrderFormValues,
  WorkOrderListItem,
} from "./schema";

export type WorkOrdersQuery = ListQuery & { status: string };

export async function fetchWorkOrders(params: WorkOrdersQuery) {
  const { data } = await api.get<ListResponse<WorkOrderListItem>>(
    "/work-orders",
    { params },
  );
  return data;
}

export async function fetchWorkOrder(id: string) {
  const { data } = await api.get<WorkOrderDetail>(`/work-orders/${id}`);
  return data;
}

export async function createWorkOrder(values: WorkOrderFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/work-orders",
    values,
  );
  return data;
}

export async function finishWorkOrder(id: string, qty?: number) {
  await api.post(`/work-orders/${id}/finish`, qty != null ? { qty } : {});
}

export async function cancelWorkOrder(id: string) {
  await api.post(`/work-orders/${id}/cancel`);
}
