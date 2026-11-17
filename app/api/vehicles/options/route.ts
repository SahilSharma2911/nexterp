import { NextResponse } from "next/server";
import { vehicleOptions } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await vehicleOptions());
}
