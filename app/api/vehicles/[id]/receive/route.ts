import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { noteSchema } from "@/modules/dms/vehicles/lifecycle-schema";
import { receiveVehicleAtDealer } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { note } = noteSchema.parse(await req.json().catch(() => ({})));
    const session = await getSession();
    await receiveVehicleAtDealer(id, note, session?.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
