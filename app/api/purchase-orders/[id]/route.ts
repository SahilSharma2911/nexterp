import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { purchaseOrderFormSchema } from "@/features/purchase-order/schema";
import {
  deletePurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
} from "@/lib/services/purchase-order";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getPurchaseOrder(id);
  if (!row)
    return NextResponse.json(
      { message: "Purchase Order not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = purchaseOrderFormSchema.parse(await req.json());
    const row = await updatePurchaseOrder(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deletePurchaseOrder(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
