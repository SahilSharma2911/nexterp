import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { deliveryNoteFormSchema } from "@/features/delivery-note/schema";
import {
  createDeliveryNote,
  listDeliveryNotes,
} from "@/lib/services/delivery-note";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listDeliveryNotes(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = deliveryNoteFormSchema.parse(await req.json());
    const row = await createDeliveryNote(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
