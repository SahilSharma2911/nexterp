import { NextResponse } from "next/server";
import { serialAnalytics } from "@/lib/services/serials";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await serialAnalytics());
}
