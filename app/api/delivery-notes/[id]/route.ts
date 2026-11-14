import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { deliveryNoteFormSchema } from "@/features/delivery-note/schema";
import {
  deleteDeliveryNote,
  getDeliveryNote,
  updateDeliveryNote,
} from "@/lib/services/delivery-note";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getDeliveryNote(id);
  if (!row)
    return NextResponse.json(
      { message: "Delivery Note not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = deliveryNoteFormSchema.parse(await req.json());
    const row = await updateDeliveryNote(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteDeliveryNote(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
