import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { purchaseReceiptFormSchema } from "@/features/purchase-receipt/schema";
import {
  deletePurchaseReceipt,
  getPurchaseReceipt,
  updatePurchaseReceipt,
} from "@/lib/services/purchase-receipt";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getPurchaseReceipt(id);
  if (!row)
    return NextResponse.json(
      { message: "Purchase Receipt not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = purchaseReceiptFormSchema.parse(await req.json());
    const row = await updatePurchaseReceipt(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deletePurchaseReceipt(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
