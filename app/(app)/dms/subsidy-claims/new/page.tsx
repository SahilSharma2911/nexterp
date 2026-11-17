import { PageHeader } from "@/components/page-header";
import { SubsidyClaimForm } from "@/modules/dms/subsidy-claims/claim-form";

export const metadata = { title: "New Subsidy Claim · nexterp" };

export const dynamic = "force-dynamic";

export default async function NewSubsidyClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { vehicle } = await searchParams;
  return (
    <>
      <PageHeader title="New Subsidy Claim" subtitle="Claim an EV incentive" />
      <SubsidyClaimForm prefillVehicleId={vehicle} />
    </>
  );
}
