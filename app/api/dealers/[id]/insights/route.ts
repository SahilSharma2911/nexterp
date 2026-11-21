import { NextResponse } from "next/server";
import { dealerDetail } from "@/lib/services/dealers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await dealerDetail(id);
  if (!detail)
    return NextResponse.json({ message: "Dealer not found" }, { status: 404 });
  return NextResponse.json(detail);
}
