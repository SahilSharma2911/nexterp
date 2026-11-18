import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { serviceBayFormSchema } from "@/modules/dms/service-bays/schema";
import {
  deleteServiceBay,
  getServiceBayById,
  updateServiceBay,
} from "@/lib/services/service-bays";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getServiceBayById(id);
  if (!row)
    return NextResponse.json(
      { message: "Service bay not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = serviceBayFormSchema.parse(await req.json());
    const row = await updateServiceBay(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteServiceBay(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
