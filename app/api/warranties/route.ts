import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { warrantyFormSchema } from "@/modules/dms/warranties/schema";
import { createWarranty, listWarranties } from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listWarranties(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    component: sp.get("component") ?? undefined,
    vehicleId: sp.get("vehicle") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = warrantyFormSchema.parse(await req.json());
    const row = await createWarranty(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
