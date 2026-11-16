import { NextResponse } from "next/server";
import { accountOptions } from "@/lib/services/chart-of-accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await accountOptions());
}
