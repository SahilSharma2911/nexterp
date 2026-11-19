import { NextResponse } from "next/server";
import { dealerAnalytics } from "@/lib/services/dealers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await dealerAnalytics());
}
