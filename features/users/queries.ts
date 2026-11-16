"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ListQuery } from "@/lib/api-list";
import * as usersApi from "./api";
import type { UserCreateValues, UserUpdateValues } from "./schema";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: ListQuery) => [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function useUsers(params: ListQuery) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.fetchUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => usersApi.fetchUser(id as string),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UserCreateValues) => usersApi.createUser(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserUpdateValues }) =>
      usersApi.updateUser(id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.setQueryData(userKeys.detail(row.id), row);
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
