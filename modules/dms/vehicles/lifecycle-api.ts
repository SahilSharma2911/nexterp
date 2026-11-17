import { api } from "@/lib/axios";
import type {
  AllocateValues,
  DeliverValues,
  PdiValues,
  VehicleLifecycle,
} from "./lifecycle-schema";

export async function fetchLifecycle(id: string) {
  const { data } = await api.get<VehicleLifecycle>(`/vehicles/${id}/timeline`);
  return data;
}

export async function allocate(id: string, values: AllocateValues) {
  await api.post(`/vehicles/${id}/allocate`, values);
}
export async function dispatch(id: string, note?: string) {
  await api.post(`/vehicles/${id}/dispatch`, { note });
}
export async function receiveAtDealer(id: string, note?: string) {
  await api.post(`/vehicles/${id}/receive`, { note });
}
export async function runPdi(id: string, values: PdiValues) {
  const { data } = await api.post<{ ok: boolean; result: "PASS" | "FAIL" }>(
    `/vehicles/${id}/pdi`,
    values,
  );
  return data;
}
export async function deliver(id: string, values: DeliverValues) {
  await api.post(`/vehicles/${id}/deliver`, values);
}
