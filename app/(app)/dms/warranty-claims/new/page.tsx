import { PageHeader } from "@/components/page-header";
import { ClaimForm } from "@/modules/dms/warranty-claims/claim-form";

export const metadata = { title: "New Warranty Claim · Seeka Motor" };

export const dynamic = "force-dynamic";

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ warranty?: string; job?: string }>;
}) {
  const { warranty, job } = await searchParams;
  return (
    <>
      <PageHeader title="New Warranty Claim" subtitle="Raise a claim" />
      <ClaimForm prefillWarrantyId={warranty} prefillJobCardId={job} />
    </>
  );
}
