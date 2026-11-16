import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata = { title: "Dashboard · nexterp" };

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardView />;
}
