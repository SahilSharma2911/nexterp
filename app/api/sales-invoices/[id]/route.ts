import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { salesInvoiceFormSchema } from "@/features/sales-invoice/schema";
import {
  deleteSalesInvoice,
  getSalesInvoice,
  updateSalesInvoice,
} from "@/lib/services/sales-invoice";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getSalesInvoice(id);
  if (!row)
    return NextResponse.json(
      { message: "Sales Invoice not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = salesInvoiceFormSchema.parse(await req.json());
    const row = await updateSalesInvoice(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteSalesInvoice(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
