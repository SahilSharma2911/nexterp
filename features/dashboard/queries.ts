"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "./api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"] as const,
    queryFn: fetchDashboard,
    // Keep the overview fresh without a manual reload.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
