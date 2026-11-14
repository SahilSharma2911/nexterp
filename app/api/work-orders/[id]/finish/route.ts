import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { finishWorkOrderSchema } from "@/features/work-order/schema";
import { finishWorkOrder } from "@/lib/services/work-order";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { qty } = finishWorkOrderSchema.parse(body ?? {});
    await finishWorkOrder(id, qty);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
