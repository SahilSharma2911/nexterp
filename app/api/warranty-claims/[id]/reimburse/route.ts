import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { reimburseClaim } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return NextResponse.json({ message: "A positive amount is required" }, { status: 400 });
    const session = await getSession();
    await reimburseClaim(id, { amount, by: session?.name ?? null });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
