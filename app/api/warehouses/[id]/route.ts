import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { warehouseFormSchema } from "@/features/warehouses/schema";
import {
  deleteWarehouse,
  getWarehouseById,
  updateWarehouse,
} from "@/lib/services/warehouses";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getWarehouseById(id);
  if (!row)
    return NextResponse.json(
      { message: "Warehouse not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = warehouseFormSchema.parse(await req.json());
    const row = await updateWarehouse(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteWarehouse(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
