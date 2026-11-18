import { AppointmentDetail } from "@/modules/dms/service-appointments/appointment-detail";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetail appointmentId={id} />;
}
