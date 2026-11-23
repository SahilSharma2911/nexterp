import { NextResponse } from "next/server";
import { warrantyAnalytics } from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await warrantyAnalytics());
}
