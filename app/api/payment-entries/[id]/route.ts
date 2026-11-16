import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { paymentEntryFormSchema } from "@/features/payment-entry/schema";
import {
  deletePaymentEntry,
  getPaymentEntry,
  updatePaymentEntry,
} from "@/lib/services/payment-entry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getPaymentEntry(id);
  if (!row)
    return NextResponse.json(
      { message: "Payment Entry not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = paymentEntryFormSchema.parse(await req.json());
    const row = await updatePaymentEntry(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deletePaymentEntry(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
