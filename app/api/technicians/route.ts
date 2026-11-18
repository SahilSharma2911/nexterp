import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { technicianFormSchema } from "@/modules/dms/technicians/schema";
import { createTechnician, listTechnicians } from "@/lib/services/technicians";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listTechnicians(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = technicianFormSchema.parse(await req.json());
    const row = await createTechnician(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
