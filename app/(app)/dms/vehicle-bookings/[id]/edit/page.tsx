import { PageHeader } from "@/components/page-header";
import { BookingForm } from "@/modules/dms/vehicle-bookings/booking-form";

export const metadata = { title: "Edit Booking · Seeka Motor" };

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Booking" subtitle="Update booking details" />
      <BookingForm bookingId={id} />
    </>
  );
}
