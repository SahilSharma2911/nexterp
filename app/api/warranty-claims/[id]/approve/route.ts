import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { approveClaim } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await approveClaim(id, {
      approvedAmount:
        typeof body.approvedAmount === "number" ? body.approvedAmount : undefined,
      oemRef: typeof body.oemRef === "string" ? body.oemRef : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
