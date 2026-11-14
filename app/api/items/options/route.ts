import { NextResponse } from "next/server";
import { itemOptions } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await itemOptions());
}
