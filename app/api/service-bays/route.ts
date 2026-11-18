import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { serviceBayFormSchema } from "@/modules/dms/service-bays/schema";
import { createServiceBay, listServiceBays } from "@/lib/services/service-bays";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listServiceBays(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = serviceBayFormSchema.parse(await req.json());
    const row = await createServiceBay(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
