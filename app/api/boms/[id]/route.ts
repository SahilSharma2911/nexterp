import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { bomFormSchema } from "@/features/bom/schema";
import { deleteBom, getBom, updateBom } from "@/lib/services/bom";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getBom(id);
  if (!row)
    return NextResponse.json({ message: "BOM not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = bomFormSchema.parse(await req.json());
    const row = await updateBom(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteBom(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
