import { NextResponse, type NextRequest } from "next/server";
import { purchaseOrderPrefill } from "@/lib/services/purchase-order";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await purchaseOrderPrefill(id);
  if (!data)
    return NextResponse.json(
      { message: "Order not available for receipt" },
      { status: 404 },
    );
  return NextResponse.json(data);
}
