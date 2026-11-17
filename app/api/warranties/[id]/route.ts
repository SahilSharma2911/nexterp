import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { warrantyFormSchema } from "@/modules/dms/warranties/schema";
import {
  deleteWarranty,
  getWarrantyById,
  updateWarranty,
} from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getWarrantyById(id);
  if (!row)
    return NextResponse.json(
      { message: "Warranty not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = warrantyFormSchema.parse(await req.json());
    const row = await updateWarranty(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteWarranty(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
