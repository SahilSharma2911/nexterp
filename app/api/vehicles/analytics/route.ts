import { NextResponse } from "next/server";
import { vehicleAnalytics } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await vehicleAnalytics());
}
