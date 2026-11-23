import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { recallFormSchema } from "@/modules/dms/recalls/schema";
import { createRecall, listRecalls } from "@/lib/services/recalls";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listRecalls(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    severity: sp.get("severity") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = recallFormSchema.parse(await req.json());
    const row = await createRecall(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
