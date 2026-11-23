import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { addClaimEvent } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const session = await getSession();
    await addClaimEvent(id, {
      kind: body?.kind === "NOTE" ? "NOTE" : "COMMENT",
      note: body?.note ?? "",
      by: body?.by ?? session?.name ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
