import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { BookingsTable } from "@/modules/dms/vehicle-bookings/bookings-table";
import { BookingAnalytics } from "@/modules/dms/vehicle-bookings/booking-analytics";

export const metadata = { title: "Vehicle Bookings · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function VehicleBookingsPage() {
  return (
    <>
      <PageHeader
        title="Vehicle Bookings"
        subtitle="Customer order queue — book, allot ready stock, deliver"
        actions={
          <NewButton
            href="/dms/vehicle-bookings/new"
            label="New Booking"
            area="dms"
          />
        }
      />
      <div className="space-y-6">
        <BookingAnalytics />
        <BookingsTable />
      </div>
    </>
  );
}
