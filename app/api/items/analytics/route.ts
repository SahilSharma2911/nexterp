import { NextResponse } from "next/server";
import { itemAnalytics } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await itemAnalytics());
}
