import { PageHeader } from "@/components/page-header";
import { AppointmentForm } from "@/modules/dms/service-appointments/appointment-form";

export const metadata = { title: "Edit Appointment · nexterp" };

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        title="Edit Appointment"
        subtitle="Update the booking"
      />
      <AppointmentForm appointmentId={id} />
    </>
  );
}
