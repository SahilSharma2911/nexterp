import { NextResponse, type NextRequest } from "next/server";
import { getVehicleRelated } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(await getVehicleRelated(id));
}
