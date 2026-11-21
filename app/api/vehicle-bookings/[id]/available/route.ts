import { NextResponse, type NextRequest } from "next/server";
import { availableVehicles } from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(await availableVehicles(id));
}
