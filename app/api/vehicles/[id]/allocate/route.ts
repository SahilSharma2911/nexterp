import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { allocateSchema } from "@/modules/dms/vehicles/lifecycle-schema";
import { allocateVehicle } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const values = allocateSchema.parse(await req.json());
    const session = await getSession();
    await allocateVehicle(id, values, session?.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
