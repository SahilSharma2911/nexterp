import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { paymentEntryFormSchema } from "@/features/payment-entry/schema";
import {
  createPaymentEntry,
  listPaymentEntries,
} from "@/lib/services/payment-entry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listPaymentEntries(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    type: sp.get("type") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = paymentEntryFormSchema.parse(await req.json());
    const row = await createPaymentEntry(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
