import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { allotBooking } from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (!body?.vehicleId)
      return NextResponse.json({ message: "vehicleId is required" }, { status: 400 });
    await allotBooking(id, body.vehicleId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
