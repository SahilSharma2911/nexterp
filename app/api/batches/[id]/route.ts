import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { batchFormSchema } from "@/features/batches/schema";
import { deleteBatch, getBatchById, updateBatch } from "@/lib/services/batches";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const batch = await getBatchById(id);
  if (!batch)
    return NextResponse.json({ message: "Batch not found" }, { status: 404 });
  return NextResponse.json(batch);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = batchFormSchema.parse(await req.json());
    const batch = await updateBatch(id, values);
    return NextResponse.json(batch);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteBatch(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
