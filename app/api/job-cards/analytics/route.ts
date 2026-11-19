import { NextResponse } from "next/server";
import { jobCardAnalytics } from "@/lib/services/job-cards";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await jobCardAnalytics());
}
