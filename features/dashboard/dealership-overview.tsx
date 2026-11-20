"use client";

import Link from "next/link";
import {
  CalendarClock,
  PackageCheck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { isModuleEnabled } from "@/lib/modules";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { fmtMoney } from "@/lib/format";
import { useVehicleAnalytics } from "@/modules/dms/vehicles/queries";
import { useJobCardAnalytics } from "@/modules/dms/job-cards/queries";
import { useAppointmentAnalytics } from "@/modules/dms/service-appointments/queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

export function DealershipOverview() {
  const enabled = isModuleEnabled("dms");
  const veh = useVehicleAnalytics();
  const jobs = useJobCardAnalytics();
  const appts = useAppointmentAnalytics();

  if (!enabled) return null;

  const loading = veh.isLoading || jobs.isLoading || appts.isLoading;
  const items: StatItem[] | undefined =
    veh.data && jobs.data && appts.data
      ? [
          {
            label: "Vehicles in stock",
            value: veh.data.inStock,
            icon: Warehouse,
            href: "/dms/vehicles",
            sub: `${veh.data.inPipeline} in transit to dealers`,
          },
          {
            label: "Delivered",
            value: veh.data.delivered,
            icon: PackageCheck,
            tone: "positive",
            href: "/dms/vehicles",
            sub: `${compactMoney(veh.data.deliveredValue)} sold`,
          },
          {
            label: "Open job cards",
            value: jobs.data.open,
            icon: Wrench,
            tone: "warning",
            href: "/dms/job-cards",
            sub: `${compactMoney(jobs.data.revenue)} service revenue`,
          },
          {
            label: "Booked appointments",
            value: appts.data.booked,
            icon: CalendarClock,
            href: "/dms/service-appointments",
            sub: `${appts.data.hv} high-voltage`,
          },
        ]
      : undefined;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Dealership</h2>
        <Link
          href="/dms/vehicles"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </div>
      <StatCards items={items} loading={loading} />
      <div className="mt-4">
        <CategoryBarChart
          title="Vehicles by lifecycle stage"
          data={veh.data?.byStage ?? []}
          emptyMessage="No vehicles yet."
        />
      </div>
    </section>
  );
}
