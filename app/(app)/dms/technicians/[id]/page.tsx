import { TechnicianDetail } from "@/modules/dms/technicians/technician-detail";

export const dynamic = "force-dynamic";

export default async function TechnicianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TechnicianDetail technicianId={id} />;
}
