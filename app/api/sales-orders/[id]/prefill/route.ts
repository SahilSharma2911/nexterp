import { NextResponse, type NextRequest } from "next/server";
import { salesOrderPrefill } from "@/lib/services/sales-order";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await salesOrderPrefill(id);
  if (!data)
    return NextResponse.json(
      { message: "Order not available for delivery" },
      { status: 404 },
    );
  return NextResponse.json(data);
}
