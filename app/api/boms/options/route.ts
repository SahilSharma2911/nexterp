import { NextResponse } from "next/server";
import { bomOptions } from "@/lib/services/bom";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await bomOptions());
}
