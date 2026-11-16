"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as accountsApi from "./api";
import type { AccountFormValues } from "./schema";

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (params: ListQuery) => [...accountKeys.lists(), params] as const,
  detail: (id: string) => [...accountKeys.all, "detail", id] as const,
};

export function useAccounts(params: ListQuery) {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () => accountsApi.fetchAccounts(params),
    placeholderData: keepPreviousData,
  });
}

export function useAccountOptions() {
  return useQuery({
    queryKey: [...accountKeys.all, "options"] as const,
    queryFn: () => accountsApi.fetchAccountOptions(),
    staleTime: 5 * 60_000,
  });
}

export function useAccount(id?: string) {
  return useQuery({
    queryKey: accountKeys.detail(id ?? ""),
    queryFn: () => accountsApi.fetchAccount(id as string),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AccountFormValues) => accountsApi.createAccount(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Account created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccountFormValues }) =>
      accountsApi.updateAccount(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.setQueryData(accountKeys.detail(row.id), row);
      toast.success("Account updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Account deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSeedAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => accountsApi.seedAccounts(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      toast.success(
        r.created > 0
          ? `Added ${r.created} standard account${r.created === 1 ? "" : "s"}`
          : "Standard accounts already exist",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
