import { ClaimDetail } from "@/modules/dms/warranty-claims/claim-detail";

export const dynamic = "force-dynamic";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClaimDetail claimId={id} />;
}
