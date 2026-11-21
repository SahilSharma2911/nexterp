import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { serialFormSchema } from "@/features/serials/schema";
import { deleteSerial, getSerialById, updateSerial } from "@/lib/services/serials";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const serial = await getSerialById(id);
  if (!serial)
    return NextResponse.json({ message: "Serial not found" }, { status: 404 });
  return NextResponse.json(serial);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = serialFormSchema.parse(await req.json());
    const serial = await updateSerial(id, values);
    return NextResponse.json(serial);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteSerial(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
