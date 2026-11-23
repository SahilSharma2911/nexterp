import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { setRecallStatus } from "@/lib/services/recalls";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = body?.status === "CLOSED" ? "CLOSED" : "OPEN";
    await setRecallStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
