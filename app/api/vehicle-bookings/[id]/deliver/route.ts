import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { deliverBooking } from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    await deliverBooking(id, session?.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
