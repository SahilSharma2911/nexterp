import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { purchaseInvoiceFormSchema } from "@/features/purchase-invoice/schema";
import {
  createPurchaseInvoice,
  listPurchaseInvoices,
} from "@/lib/services/purchase-invoice";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listPurchaseInvoices(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = purchaseInvoiceFormSchema.parse(await req.json());
    const row = await createPurchaseInvoice(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
