import { NextResponse, type NextRequest } from "next/server";
import { itemByBarcode } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  return NextResponse.json(await itemByBarcode(code));
}
