import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { registerSaleCoverage } from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  try {
    const { vehicleId } = await params;
    return NextResponse.json(await registerSaleCoverage(vehicleId));
  } catch (e) {
    return errorResponse(e);
  }
}
