import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { bomFormSchema } from "@/features/bom/schema";
import { createBom, listBoms } from "@/lib/services/bom";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listBoms(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = bomFormSchema.parse(await req.json());
    const row = await createBom(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
