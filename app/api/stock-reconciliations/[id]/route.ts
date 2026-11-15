import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { reconciliationFormSchema } from "@/features/stock-reconciliation/schema";
import {
  deleteStockReconciliation,
  getStockReconciliation,
  updateStockReconciliation,
} from "@/lib/services/stock-reconciliation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getStockReconciliation(id);
  if (!row)
    return NextResponse.json(
      { message: "Stock Reconciliation not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = reconciliationFormSchema.parse(await req.json());
    const row = await updateStockReconciliation(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteStockReconciliation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
