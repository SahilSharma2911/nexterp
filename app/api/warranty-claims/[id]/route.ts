import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { claimFormSchema } from "@/modules/dms/warranty-claims/schema";
import {
  deleteClaim,
  getClaim,
  updateClaim,
} from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getClaim(id);
  if (!row)
    return NextResponse.json({ message: "Claim not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = claimFormSchema.parse(await req.json());
    const row = await updateClaim(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteClaim(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
