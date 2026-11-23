import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { RECALL_ITEM_STATUSES } from "@/modules/dms/recalls/schema";
import { removeRecallItem, setItemStatus } from "@/lib/services/recalls";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { itemId } = await params;
    const body = await req.json().catch(() => ({}));
    if (!RECALL_ITEM_STATUSES.includes(body?.status))
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    await setItemStatus(itemId, body.status, {
      jobCardId: body.jobCardId ?? undefined,
      notes: body.notes ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { itemId } = await params;
    await removeRecallItem(itemId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
