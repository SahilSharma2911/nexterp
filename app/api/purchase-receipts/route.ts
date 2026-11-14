import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { purchaseReceiptFormSchema } from "@/features/purchase-receipt/schema";
import {
  createPurchaseReceipt,
  listPurchaseReceipts,
} from "@/lib/services/purchase-receipt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listPurchaseReceipts(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = purchaseReceiptFormSchema.parse(await req.json());
    const row = await createPurchaseReceipt(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
