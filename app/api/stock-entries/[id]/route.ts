import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { stockEntryFormSchema } from "@/features/stock-entry/schema";
import {
  deleteStockEntry,
  getStockEntry,
  updateStockEntry,
} from "@/lib/services/stock-entry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getStockEntry(id);
  if (!row)
    return NextResponse.json(
      { message: "Stock Entry not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = stockEntryFormSchema.parse(await req.json());
    const row = await updateStockEntry(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteStockEntry(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
