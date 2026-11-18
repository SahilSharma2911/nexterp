import { PageHeader } from "@/components/page-header";
import { AppointmentsTable } from "@/modules/dms/service-appointments/appointments-table";

export const metadata = { title: "Service Appointments · nexterp" };

export const dynamic = "force-dynamic";

export default function ServiceAppointmentsPage() {
  return (
    <>
      <PageHeader
        title="Service Appointments"
        subtitle="Workshop bookings"
      />
      <AppointmentsTable />
    </>
  );
}
