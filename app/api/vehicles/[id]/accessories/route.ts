import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { vehicleAccessorySchema } from "@/modules/dms/vehicles/lifecycle-schema";
import { addVehicleAccessory } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const values = vehicleAccessorySchema.parse(await req.json());
    await addVehicleAccessory(id, values);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
