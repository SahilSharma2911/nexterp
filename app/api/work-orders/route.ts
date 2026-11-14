import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { workOrderFormSchema } from "@/features/work-order/schema";
import {
  createWorkOrder,
  listWorkOrders,
} from "@/lib/services/work-order";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listWorkOrders(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = workOrderFormSchema.parse(await req.json());
    const row = await createWorkOrder(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
