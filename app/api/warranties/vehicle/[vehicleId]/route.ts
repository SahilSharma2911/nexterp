import { NextResponse, type NextRequest } from "next/server";
import { getVehicleRegistration } from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const { vehicleId } = await params;
  const reg = await getVehicleRegistration(vehicleId);
  if (!reg)
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  return NextResponse.json(reg);
}
