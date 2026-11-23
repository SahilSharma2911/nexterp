import { PageHeader } from "@/components/page-header";
import { WarrantyInsights } from "@/modules/dms/warranties/warranty-insights";

export const metadata = { title: "Warranty Analytics · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function WarrantyAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Warranty Analytics"
        subtitle="EV-specific — claim frequency, rejections, fault codes, cost forecast & battery fleet"
      />
      <WarrantyInsights />
    </>
  );
}
