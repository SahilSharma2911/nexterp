import { NextResponse } from "next/server";
import { warrantyClaimAnalytics } from "@/lib/services/warranty-claims";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await warrantyClaimAnalytics());
}
