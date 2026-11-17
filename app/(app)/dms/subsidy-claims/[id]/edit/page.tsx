import { PageHeader } from "@/components/page-header";
import { SubsidyClaimForm } from "@/modules/dms/subsidy-claims/claim-form";

export const metadata = { title: "Edit Subsidy Claim · nexterp" };

export default async function EditSubsidyClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Subsidy Claim" subtitle="Draft claim" />
      <SubsidyClaimForm claimId={id} />
    </>
  );
}
