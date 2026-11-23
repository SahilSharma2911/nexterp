import { NextResponse, type NextRequest } from "next/server";
import { claimDefaultsFromJob } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const jobCardId = req.nextUrl.searchParams.get("jobCardId");
  if (!jobCardId)
    return NextResponse.json({ message: "jobCardId is required" }, { status: 400 });
  const defaults = await claimDefaultsFromJob(jobCardId);
  if (!defaults)
    return NextResponse.json({ message: "Job card not found" }, { status: 404 });
  return NextResponse.json(defaults);
}
