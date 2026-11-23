import { PageHeader } from "@/components/page-header";
import { EligibilityCheck } from "@/modules/dms/warranty-claims/eligibility-check";

export const metadata = { title: "Eligibility Check · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function EligibilityCheckPage() {
  return (
    <>
      <PageHeader
        title="Automated Eligibility Check"
        subtitle="EV-specific — coverage, mileage, battery SoH, fault code & maintenance"
      />
      <EligibilityCheck />
    </>
  );
}
