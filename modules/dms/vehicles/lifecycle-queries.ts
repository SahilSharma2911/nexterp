"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as lc from "./lifecycle-api";
import { vehicleKeys } from "./queries";
import type {
  AllocateValues,
  DeliverValues,
  PdiValues,
  VehicleAccessoryValues,
} from "./lifecycle-schema";

export const lifecycleKey = (id: string) =>
  [...vehicleKeys.detail(id), "lifecycle"] as const;

export function useVehicleLifecycle(id?: string) {
  return useQuery({
    queryKey: lifecycleKey(id ?? ""),
    queryFn: () => lc.fetchLifecycle(id as string),
    enabled: !!id,
  });
}

function useStageMutation<T>(
  id: string,
  fn: (vals: T) => Promise<unknown>,
  msg: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      qc.invalidateQueries({ queryKey: lifecycleKey(id) });
      toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useAllocateVehicle = (id: string) =>
  useStageMutation<AllocateValues>(id, (v) => lc.allocate(id, v), "Allocated to dealer");
export const useDispatchVehicle = (id: string) =>
  useStageMutation<string | undefined>(id, (note) => lc.dispatch(id, note), "Dispatched");
export const useReceiveVehicle = (id: string) =>
  useStageMutation<string | undefined>(id, (note) => lc.receiveAtDealer(id, note), "Received at dealer");
export const useDeliverVehicle = (id: string) =>
  useStageMutation<DeliverValues>(id, (v) => lc.deliver(id, v), "Delivered to customer");
export const useAddVehicleAccessory = (id: string) =>
  useStageMutation<VehicleAccessoryValues>(
    id,
    (v) => lc.addAccessory(id, v),
    "Accessory added",
  );
export const useRemoveVehicleAccessory = (id: string) =>
  useStageMutation<string>(
    id,
    (accId) => lc.removeAccessory(id, accId),
    "Accessory removed",
  );

export function useRunPdi(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: PdiValues) => lc.runPdi(id, v),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      qc.invalidateQueries({ queryKey: lifecycleKey(id) });
      if (res.result === "PASS") toast.success("PDI passed");
      else toast.error("PDI failed — re-inspection required");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
