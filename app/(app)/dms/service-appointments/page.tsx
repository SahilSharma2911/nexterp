import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { AppointmentsTable } from "@/modules/dms/service-appointments/appointments-table";
import { AppointmentAnalytics } from "@/modules/dms/service-appointments/appointment-analytics";

export const metadata = { title: "Service Appointments · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ServiceAppointmentsPage() {
  return (
    <>
      <PageHeader
        title="Service Appointments"
        subtitle="Workshop bookings"
        actions={
          <NewButton
            href="/dms/service-appointments/new"
            label="New Appointment"
            area="dms"
          />
        }
      />
      <div className="space-y-6">
        <AppointmentAnalytics />
        <AppointmentsTable />
      </div>
    </>
  );
}
