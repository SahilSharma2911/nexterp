import { NextResponse, type NextRequest } from "next/server";
import { serialByBarcode } from "@/lib/services/serials";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  return NextResponse.json(await serialByBarcode(code));
}
