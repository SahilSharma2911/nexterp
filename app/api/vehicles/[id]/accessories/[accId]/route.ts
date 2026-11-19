import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { removeVehicleAccessory } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; accId: string }> },
) {
  try {
    const { id, accId } = await params;
    await removeVehicleAccessory(id, accId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
