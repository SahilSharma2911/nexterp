import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { deleteAllocationRequest } from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteAllocationRequest(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
