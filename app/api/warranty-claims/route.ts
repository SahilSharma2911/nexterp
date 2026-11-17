import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { claimFormSchema } from "@/modules/dms/warranty-claims/schema";
import { createClaim, listClaims } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listClaims(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = claimFormSchema.parse(await req.json());
    const row = await createClaim(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
