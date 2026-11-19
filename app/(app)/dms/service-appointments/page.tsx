import { PageHeader } from "@/components/page-header";
import { AppointmentsTable } from "@/modules/dms/service-appointments/appointments-table";
import { AppointmentAnalytics } from "@/modules/dms/service-appointments/appointment-analytics";

export const metadata = { title: "Service Appointments · nexterp" };

export const dynamic = "force-dynamic";

export default function ServiceAppointmentsPage() {
  return (
    <>
      <PageHeader
        title="Service Appointments"
        subtitle="Workshop bookings"
      />
      <div className="space-y-6">
        <AppointmentAnalytics />
        <AppointmentsTable />
      </div>
    </>
  );
}
