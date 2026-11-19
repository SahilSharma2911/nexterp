import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { ClaimsTable } from "@/modules/dms/warranty-claims/claims-table";
import { ClaimAnalytics } from "@/modules/dms/warranty-claims/claim-analytics";

export const metadata = { title: "Warranty Claims · nexterp" };

export const dynamic = "force-dynamic";

export default function WarrantyClaimsPage() {
  return (
    <>
      <PageHeader
        title="Warranty Claims"
        subtitle="OEM claims with eligibility checks"
        actions={
          <NewButton
            href="/dms/warranty-claims/new"
            label="New Claim"
            area="dms"
          />
        }
      />
      <div className="space-y-6">
        <ClaimAnalytics />
        <ClaimsTable />
      </div>
    </>
  );
}
