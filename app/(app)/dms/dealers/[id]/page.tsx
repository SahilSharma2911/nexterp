import { DealerDetail } from "@/modules/dms/dealers/dealer-detail";

export const dynamic = "force-dynamic";

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealerDetail dealerId={id} />;
}
