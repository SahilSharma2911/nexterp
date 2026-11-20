import { PageHeader } from "@/components/page-header";
import { ClaimForm } from "@/modules/dms/warranty-claims/claim-form";

export const metadata = { title: "Edit Warranty Claim · Seeka Motor" };

export default async function EditClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Warranty Claim" subtitle="Draft claim" />
      <ClaimForm claimId={id} />
    </>
  );
}
