import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { bookingFormSchema } from "@/modules/dms/vehicle-bookings/schema";
import {
  deleteBooking,
  getBookingById,
  updateBooking,
} from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking)
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = bookingFormSchema.parse(await req.json());
    return NextResponse.json(await updateBooking(id, values));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteBooking(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
