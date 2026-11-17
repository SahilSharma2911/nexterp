import { NextResponse } from "next/server";
import { schemeOptions } from "@/lib/services/subsidy-schemes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await schemeOptions());
}
