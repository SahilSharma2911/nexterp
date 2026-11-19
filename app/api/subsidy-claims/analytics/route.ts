import { NextResponse } from "next/server";
import { subsidyClaimAnalytics } from "@/lib/services/subsidy-claims";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await subsidyClaimAnalytics());
}
