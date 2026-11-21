"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as apptApi from "./api";
import type { AppointmentFormValues } from "./schema";

export const appointmentKeys = {
  all: ["service-appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (params: apptApi.AppointmentsQuery) =>
    [...appointmentKeys.lists(), params] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
};

export function useAppointments(params: apptApi.AppointmentsQuery) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => apptApi.fetchAppointments(params),
    placeholderData: keepPreviousData,
  });
}

export function useAppointment(id?: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? ""),
    queryFn: () => apptApi.fetchAppointment(id as string),
    enabled: !!id,
  });
}

export function useAppointmentAnalytics() {
  return useQuery({
    queryKey: [...appointmentKeys.all, "analytics"] as const,
    queryFn: () => apptApi.fetchAppointmentAnalytics(),
    staleTime: 60_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AppointmentFormValues) =>
      apptApi.createAppointment(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success("Appointment booked");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: AppointmentFormValues;
    }) => apptApi.updateAppointment(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(row.id) });
      toast.success("Appointment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apptApi.deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success("Appointment deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStartAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apptApi.startAppointment(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["job-cards"] });
      toast.success("Work started — job card created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apptApi.cancelAppointment(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Appointment cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      bayId,
      technicianId,
    }: {
      id: string;
      bayId: string | null;
      technicianId: string | null;
    }) => apptApi.assignAppointment(id, { bayId, technicianId }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Appointment assignment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
