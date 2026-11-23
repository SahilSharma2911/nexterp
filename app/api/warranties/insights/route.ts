import { NextResponse } from "next/server";
import { warrantyInsights } from "@/lib/services/warranty-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await warrantyInsights());
}
