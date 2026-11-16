import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { dealerFormSchema } from "@/modules/dms/dealers/schema";
import { createDealer, listDealers } from "@/lib/services/dealers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listDealers(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = dealerFormSchema.parse(await req.json());
    const row = await createDealer(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
