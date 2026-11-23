import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { creditNoteFormSchema } from "@/modules/dms/reconciliation/schema";
import { createCreditNote, listCreditNotes } from "@/lib/services/credit-notes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listCreditNotes(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = creditNoteFormSchema.parse(await req.json());
    return NextResponse.json(await createCreditNote(values), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
