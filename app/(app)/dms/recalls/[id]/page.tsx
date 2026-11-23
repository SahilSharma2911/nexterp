import { RecallDetail } from "@/modules/dms/recalls/recall-detail";

export const dynamic = "force-dynamic";

export default async function RecallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecallDetail recallId={id} />;
}
