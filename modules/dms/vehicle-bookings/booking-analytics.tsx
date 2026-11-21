"use client";

import { CalendarCheck, Clock, PackageCheck, IndianRupee } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useBookingAnalytics } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function BookingAnalytics() {
  const { data, isLoading } = useBookingAnalytics();

  const items: StatItem[] | undefined = data && [
    {
      label: "In queue",
      value: data.booked,
      icon: Clock,
      tone: data.booked > 0 ? "warning" : undefined,
      sub: "waiting for a vehicle",
    },
    {
      label: "Allotted",
      value: data.allotted,
      icon: CalendarCheck,
      sub: "vehicle assigned",
    },
    {
      label: "Delivered",
      value: data.delivered,
      icon: PackageCheck,
      tone: "positive",
    },
    {
      label: "Advance collected",
      value: compactMoney(data.advanceCollected),
      icon: IndianRupee,
      sub: "tokens / advances",
    },
  ];

  return (
    <div className="space-y-3">
      <StatCards items={items} loading={isLoading} />
      <CategoryBarChart
        title="Open bookings by model (demand)"
        data={data?.byModel ?? []}
        emptyMessage="No open bookings."
      />
    </div>
  );
}
