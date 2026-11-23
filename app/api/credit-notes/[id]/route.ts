import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { creditNoteFormSchema } from "@/modules/dms/reconciliation/schema";
import { deleteCreditNote, updateCreditNote } from "@/lib/services/credit-notes";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = creditNoteFormSchema.parse(await req.json());
    return NextResponse.json(await updateCreditNote(id, values));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteCreditNote(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
