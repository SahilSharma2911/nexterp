import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { approveJobCard } from "@/lib/services/job-cards";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await approveJobCard(id, body?.approvedBy);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
