import { PageHeader } from "@/components/page-header";
import { AppointmentForm } from "@/modules/dms/service-appointments/appointment-form";

export const metadata = { title: "New Appointment · nexterp" };

export default function NewAppointmentPage() {
  return (
    <>
      <PageHeader
        title="New Appointment"
        subtitle="Book a workshop service visit"
      />
      <AppointmentForm />
    </>
  );
}
