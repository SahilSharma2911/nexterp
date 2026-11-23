import { NextResponse, type NextRequest } from "next/server";
import { getClaimEligibility } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await getClaimEligibility(id);
  if (!report)
    return NextResponse.json({ message: "Claim not found" }, { status: 404 });
  return NextResponse.json(report);
}
