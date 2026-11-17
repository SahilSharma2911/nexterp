import { SubsidyClaimDetail } from "@/modules/dms/subsidy-claims/claim-detail";

export const dynamic = "force-dynamic";

export default async function SubsidyClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubsidyClaimDetail claimId={id} />;
}
