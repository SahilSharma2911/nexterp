import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { subsidyClaimFormSchema } from "@/modules/dms/subsidy-claims/schema";
import {
  deleteSubsidyClaim,
  getSubsidyClaim,
  updateSubsidyClaim,
} from "@/lib/services/subsidy-claims";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getSubsidyClaim(id);
  if (!row)
    return NextResponse.json(
      { message: "Subsidy claim not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = subsidyClaimFormSchema.parse(await req.json());
    const row = await updateSubsidyClaim(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteSubsidyClaim(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
