import { NextResponse } from "next/server";
import { recallAnalytics } from "@/lib/services/recalls";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await recallAnalytics());
}
