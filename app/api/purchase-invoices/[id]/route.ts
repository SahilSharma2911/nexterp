import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { purchaseInvoiceFormSchema } from "@/features/purchase-invoice/schema";
import {
  deletePurchaseInvoice,
  getPurchaseInvoice,
  updatePurchaseInvoice,
} from "@/lib/services/purchase-invoice";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getPurchaseInvoice(id);
  if (!row)
    return NextResponse.json(
      { message: "Purchase Invoice not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = purchaseInvoiceFormSchema.parse(await req.json());
    const row = await updatePurchaseInvoice(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deletePurchaseInvoice(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
