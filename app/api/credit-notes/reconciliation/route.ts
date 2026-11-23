import { NextResponse } from "next/server";
import { reconciliationSummary } from "@/lib/services/credit-notes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await reconciliationSummary());
}
