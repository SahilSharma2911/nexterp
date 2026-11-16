import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { vehicleFormSchema } from "@/modules/dms/vehicles/schema";
import { createVehicle, listVehicles } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listVehicles(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    dealerId: sp.get("dealer") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = vehicleFormSchema.parse(await req.json());
    const row = await createVehicle(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
