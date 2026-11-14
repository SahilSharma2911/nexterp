import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { salesOrderFormSchema } from "@/features/sales-order/schema";
import {
  deleteSalesOrder,
  getSalesOrder,
  updateSalesOrder,
} from "@/lib/services/sales-order";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getSalesOrder(id);
  if (!row)
    return NextResponse.json(
      { message: "Sales Order not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = salesOrderFormSchema.parse(await req.json());
    const row = await updateSalesOrder(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteSalesOrder(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
