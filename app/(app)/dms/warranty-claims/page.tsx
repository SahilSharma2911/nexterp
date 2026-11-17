import { PageHeader } from "@/components/page-header";
import { ClaimsTable } from "@/modules/dms/warranty-claims/claims-table";

export const metadata = { title: "Warranty Claims · nexterp" };

export const dynamic = "force-dynamic";

export default function WarrantyClaimsPage() {
  return (
    <>
      <PageHeader
        title="Warranty Claims"
        subtitle="OEM claims with eligibility checks"
      />
      <ClaimsTable />
    </>
  );
}
