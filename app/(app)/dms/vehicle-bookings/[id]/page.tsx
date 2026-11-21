import { BookingDetail } from "@/modules/dms/vehicle-bookings/booking-detail";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetail bookingId={id} />;
}
