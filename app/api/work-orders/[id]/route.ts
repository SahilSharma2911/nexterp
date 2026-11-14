import { NextResponse, type NextRequest } from "next/server";
import { getWorkOrder } from "@/lib/services/work-order";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await getWorkOrder(id);
  if (!row)
    return NextResponse.json(
      { message: "Work Order not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}
