import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { SubsidyClaimsTable } from "@/modules/dms/subsidy-claims/claims-table";
import { SubsidyClaimAnalytics } from "@/modules/dms/subsidy-claims/subsidy-claim-analytics";

export const metadata = { title: "Subsidy Claims · nexterp" };

export const dynamic = "force-dynamic";

export default function SubsidyClaimsPage() {
  return (
    <>
      <PageHeader
        title="Subsidy Claims"
        subtitle="EV incentive claims with KYC & e-vouchers"
        actions={
          <NewButton
            href="/dms/subsidy-claims/new"
            label="New Subsidy Claim"
            area="dms"
          />
        }
      />
      <div className="space-y-6">
        <SubsidyClaimAnalytics />
        <SubsidyClaimsTable />
      </div>
    </>
  );
}
