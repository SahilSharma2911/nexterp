"use client";

import { Megaphone, Car, Wrench, CheckCircle2 } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { useRecallAnalytics } from "./queries";

export function RecallAnalytics() {
  const { data, isLoading } = useRecallAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Open campaigns", value: data.openCampaigns, icon: Megaphone, tone: data.openCampaigns > 0 ? "warning" : undefined },
    { label: "Affected vehicles", value: data.affectedVehicles, icon: Car },
    { label: "Pending", value: data.pending, icon: Wrench, tone: data.pending > 0 ? "warning" : undefined },
    {
      label: "Repaired",
      value: `${data.repaired} (${data.completionPct}%)`,
      icon: CheckCircle2,
      tone: "positive",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Open campaigns by severity"
        data={data?.bySeverity ?? []}
        emptyMessage="No open recall campaigns."
      />
    </div>
  );
}
