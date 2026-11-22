"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as bookingApi from "./api";
import type { BookingFormValues } from "./schema";

export const bookingKeys = {
  all: ["vehicle-bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (p: bookingApi.BookingsQuery) => [...bookingKeys.lists(), p] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
  available: (id: string) => [...bookingKeys.all, "available", id] as const,
};

export function useBookings(params: bookingApi.BookingsQuery) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingApi.fetchBookings(params),
    placeholderData: keepPreviousData,
  });
}

export function useBookingAnalytics() {
  return useQuery({
    queryKey: [...bookingKeys.all, "analytics"] as const,
    queryFn: () => bookingApi.fetchBookingAnalytics(),
    staleTime: 60_000,
  });
}

export function useBookingCatalogue() {
  return useQuery({
    queryKey: [...bookingKeys.all, "catalogue"] as const,
    queryFn: () => bookingApi.fetchBookingCatalogue(),
    staleTime: 60_000,
  });
}

export function useBooking(id?: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ""),
    queryFn: () => bookingApi.fetchBooking(id as string),
    enabled: !!id,
  });
}

export function useAvailableVehicles(id?: string) {
  return useQuery({
    queryKey: bookingKeys.available(id ?? ""),
    queryFn: () => bookingApi.fetchAvailableVehicles(id as string),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: BookingFormValues) => bookingApi.createBooking(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success("Booking created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BookingFormValues }) =>
      bookingApi.updateBooking(id, values),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      toast.success("Booking updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingApi.deleteBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success("Booking deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useBookingAction(
  fn: (id: string) => Promise<unknown>,
  msg: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      if (typeof id === "string")
        qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const useAllotNextVehicle = () =>
  useBookingAction(bookingApi.allotNextVehicle, "Vehicle allotted");
export const useDeliverBooking = () =>
  useBookingAction(bookingApi.deliverBooking, "Booking delivered");
export const useCancelBooking = () =>
  useBookingAction(bookingApi.cancelBooking, "Booking cancelled");

export function useAllotBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) =>
      bookingApi.allotBooking(id, vehicleId),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle allotted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
