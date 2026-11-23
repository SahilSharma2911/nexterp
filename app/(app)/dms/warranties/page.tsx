import { PageHeader } from "@/components/page-header";
import { WarrantiesTable } from "@/modules/dms/warranties/warranties-table";
import { WarrantyAnalytics } from "@/modules/dms/warranties/warranty-analytics";

export const metadata = { title: "Warranties · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function WarrantiesPage() {
  return (
    <>
      <PageHeader
        title="Warranties"
        subtitle="Coverage registered at sale · claims & eligibility"
      />
      <div className="space-y-6">
        <WarrantyAnalytics />
        <WarrantiesTable />
      </div>
    </>
  );
}
