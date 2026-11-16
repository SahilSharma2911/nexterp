import { NextResponse } from "next/server";
import { dealerOptions } from "@/lib/services/dealers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await dealerOptions());
}
