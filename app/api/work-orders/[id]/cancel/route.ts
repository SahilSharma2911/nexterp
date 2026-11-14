import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { cancelWorkOrder } from "@/lib/services/work-order";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await cancelWorkOrder(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
