import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { serialFormSchema } from "@/features/serials/schema";
import { createSerial, listSerials } from "@/lib/services/serials";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listSerials(parseListParams(sp), {
    itemId: sp.get("itemId") ?? undefined,
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = serialFormSchema.parse(await req.json());
    const serial = await createSerial(values);
    return NextResponse.json(serial, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
