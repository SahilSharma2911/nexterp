import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { purchaseOrderFormSchema } from "@/features/purchase-order/schema";
import {
  createPurchaseOrder,
  listPurchaseOrders,
} from "@/lib/services/purchase-order";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listPurchaseOrders(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = purchaseOrderFormSchema.parse(await req.json());
    const row = await createPurchaseOrder(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
