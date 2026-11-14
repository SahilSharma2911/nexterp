import { api } from "@/lib/axios";
import type { ListQuery, ListResponse } from "@/lib/api-list";
import type {
  PurchaseReceiptDetail,
  PurchaseReceiptFormValues,
  PurchaseReceiptListItem,
} from "./schema";

export type PurchaseReceiptsQuery = ListQuery & { status: string };

export async function fetchPurchaseReceipts(params: PurchaseReceiptsQuery) {
  const { data } = await api.get<ListResponse<PurchaseReceiptListItem>>(
    "/purchase-receipts",
    { params },
  );
  return data;
}

export async function fetchPurchaseReceipt(id: string) {
  const { data } = await api.get<PurchaseReceiptDetail>(
    `/purchase-receipts/${id}`,
  );
  return data;
}

export async function createPurchaseReceipt(values: PurchaseReceiptFormValues) {
  const { data } = await api.post<{ id: string; name: string }>(
    "/purchase-receipts",
    values,
  );
  return data;
}

export async function updatePurchaseReceipt(
  id: string,
  values: PurchaseReceiptFormValues,
) {
  const { data } = await api.patch<{ id: string; name: string }>(
    `/purchase-receipts/${id}`,
    values,
  );
  return data;
}

export async function deletePurchaseReceipt(id: string) {
  await api.delete(`/purchase-receipts/${id}`);
}

export async function submitPurchaseReceipt(id: string) {
  await api.post(`/purchase-receipts/${id}/submit`);
}

export async function cancelPurchaseReceipt(id: string) {
  await api.post(`/purchase-receipts/${id}/cancel`);
}
