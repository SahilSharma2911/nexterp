import { NextResponse } from "next/server";
import { claimReconOptions } from "@/lib/services/credit-notes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await claimReconOptions());
}
