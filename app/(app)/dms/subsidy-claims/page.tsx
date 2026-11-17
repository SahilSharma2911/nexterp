import { PageHeader } from "@/components/page-header";
import { SubsidyClaimsTable } from "@/modules/dms/subsidy-claims/claims-table";

export const metadata = { title: "Subsidy Claims · nexterp" };

export const dynamic = "force-dynamic";

export default function SubsidyClaimsPage() {
  return (
    <>
      <PageHeader
        title="Subsidy Claims"
        subtitle="EV incentive claims with KYC & e-vouchers"
      />
      <SubsidyClaimsTable />
    </>
  );
}
