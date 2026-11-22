import { NextResponse } from "next/server";
import { vehicleCatalogue } from "@/lib/services/vehicle-bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await vehicleCatalogue());
}
