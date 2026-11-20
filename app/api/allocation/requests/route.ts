import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { allocationRequestFormSchema } from "@/modules/dms/allocation/schema";
import {
  createAllocationRequest,
  listAllocationRequests,
} from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listAllocationRequests({
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = allocationRequestFormSchema.parse(await req.json());
    const row = await createAllocationRequest(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
