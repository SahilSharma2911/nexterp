import { api } from "@/lib/axios";
import type { DashboardData } from "./schema";

export async function fetchDashboard() {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
}
