import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { bookingFormSchema } from "@/modules/dms/vehicle-bookings/schema";
import { createBooking, listBookings } from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listBookings(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    model: sp.get("model") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = bookingFormSchema.parse(await req.json());
    const row = await createBooking(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
