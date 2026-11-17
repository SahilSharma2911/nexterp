import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { subsidyClaimFormSchema } from "@/modules/dms/subsidy-claims/schema";
import {
  createSubsidyClaim,
  listSubsidyClaims,
} from "@/lib/services/subsidy-claims";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listSubsidyClaims(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = subsidyClaimFormSchema.parse(await req.json());
    const row = await createSubsidyClaim(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
