import { NextResponse, type NextRequest } from "next/server";
import { getVehicleLifecycle } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getVehicleLifecycle(id);
  if (!data)
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  return NextResponse.json(data);
}
