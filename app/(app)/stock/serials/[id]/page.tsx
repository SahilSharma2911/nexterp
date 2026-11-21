import { SerialDetail } from "@/features/serials/serial-detail";

export const dynamic = "force-dynamic";

export default async function SerialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SerialDetail serialId={id} />;
}
