import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { pdiSchema } from "@/modules/dms/vehicles/lifecycle-schema";
import { recordPdi } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const values = pdiSchema.parse(await req.json());
    const session = await getSession();
    const result = await recordPdi(id, values, session?.name);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
