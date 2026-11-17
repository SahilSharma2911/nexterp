import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { schemeFormSchema } from "@/modules/dms/subsidy-schemes/schema";
import { createScheme, listSchemes } from "@/lib/services/subsidy-schemes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listSchemes(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = schemeFormSchema.parse(await req.json());
    const row = await createScheme(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
