import Link from "next/link";
import { ShieldCheck, Landmark } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { Button } from "@/components/ui/button";
import { ClaimsTable } from "@/modules/dms/warranty-claims/claims-table";
import { ClaimAnalytics } from "@/modules/dms/warranty-claims/claim-analytics";

export const metadata = { title: "Warranty Claims · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function WarrantyClaimsPage() {
  return (
    <>
      <PageHeader
        title="Warranty Claims"
        subtitle="OEM claims with eligibility checks"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dms/warranty-claims/reconciliation">
                <Landmark className="size-4" />
                Reconciliation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dms/warranty-claims/check">
                <ShieldCheck className="size-4" />
                Check eligibility
              </Link>
            </Button>
            <NewButton
              href="/dms/warranty-claims/new"
              label="New Claim"
              area="dms"
            />
          </div>
        }
      />
      <div className="space-y-6">
        <ClaimAnalytics />
        <ClaimsTable />
      </div>
    </>
  );
}
