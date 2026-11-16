import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDashboard());
}
