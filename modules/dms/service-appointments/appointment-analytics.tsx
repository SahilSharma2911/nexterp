"use client";

import { CalendarClock, Play, Zap, X } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { useAppointmentAnalytics } from "./queries";

export function AppointmentAnalytics() {
  const { data, isLoading } = useAppointmentAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "Booked",
      value: data.booked,
      icon: CalendarClock,
      tone: "warning",
      sub: "awaiting work",
    },
    {
      label: "HV jobs booked",
      value: data.hv,
      icon: Zap,
      sub: "need HV bay + certified tech",
    },
    {
      label: "Converted",
      value: data.converted,
      icon: Play,
      tone: "positive",
      sub: "turned into job cards",
    },
    { label: "Cancelled", value: data.cancelled, icon: X },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Appointments by status"
        data={data?.byStatus ?? []}
        emptyMessage="No appointments yet."
        height={160}
      />
    </div>
  );
}
