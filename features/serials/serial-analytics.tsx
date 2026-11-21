"use client";

import { Hash, PackageCheck, Boxes, Ban } from "lucide-react";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { useSerialAnalytics } from "./queries";

export function SerialAnalytics() {
  const { data, isLoading } = useSerialAnalytics();

  const items: StatItem[] | undefined = data && [
    { label: "Serialised units", value: data.total, icon: Hash },
    {
      label: "In stock",
      value: data.inStock,
      icon: Boxes,
      tone: "positive",
    },
    {
      label: "Delivered",
      value: data.delivered,
      icon: PackageCheck,
      sub: "handed to customers",
    },
    {
      label: "Scrapped",
      value: data.scrapped,
      icon: Ban,
      tone: data.scrapped > 0 ? "warning" : undefined,
    },
  ];

  return <StatCards items={items} loading={isLoading} />;
}
