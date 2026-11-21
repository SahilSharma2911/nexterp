import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { jobCardFormSchema } from "@/modules/dms/job-cards/schema";
import { createJobCard, listJobCards } from "@/lib/services/job-cards";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listJobCards(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    vehicleId: sp.get("vehicle") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const asEstimate = req.nextUrl.searchParams.get("estimate") === "1";
    const values = jobCardFormSchema.parse(await req.json());
    const row = await createJobCard(values, asEstimate);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
