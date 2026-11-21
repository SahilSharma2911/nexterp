import { PageHeader } from "@/components/page-header";
import { BookingForm } from "@/modules/dms/vehicle-bookings/booking-form";

export const metadata = { title: "New Booking · Seeka Motor" };

export default function NewBookingPage() {
  return (
    <>
      <PageHeader
        title="New Booking"
        subtitle="Add a customer to the vehicle queue"
      />
      <BookingForm />
    </>
  );
}
