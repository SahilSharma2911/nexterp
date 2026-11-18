import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { jobCardQcSchema } from "@/modules/dms/job-cards/schema";
import { recordJobCardQc } from "@/lib/services/job-cards";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const values = jobCardQcSchema.parse(await req.json());
    await recordJobCardQc(id, values);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
