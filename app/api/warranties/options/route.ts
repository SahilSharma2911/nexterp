import { NextResponse, type NextRequest } from "next/server";
import { warrantyOptions } from "@/lib/services/warranties";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const vehicle = req.nextUrl.searchParams.get("vehicle") ?? undefined;
  return NextResponse.json(await warrantyOptions(vehicle));
}
