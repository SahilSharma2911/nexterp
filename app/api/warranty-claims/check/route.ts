import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { previewEligibility } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.warrantyId)
      return NextResponse.json({ message: "warrantyId is required" }, { status: 400 });
    const report = await previewEligibility({
      warrantyId: body.warrantyId,
      faultCode: body.faultCode ?? null,
      odometerKm:
        body.odometerKm === "" || body.odometerKm == null
          ? null
          : Number(body.odometerKm),
    });
    if (!report)
      return NextResponse.json({ message: "Warranty not found" }, { status: 404 });
    return NextResponse.json(report);
  } catch (e) {
    return errorResponse(e);
  }
}
