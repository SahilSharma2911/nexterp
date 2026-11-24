import { NextResponse, type NextRequest } from "next/server";
import { itemGroupStats } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const group = req.nextUrl.searchParams.get("group");
  if (!group)
    return NextResponse.json({ message: "group is required" }, { status: 400 });
  return NextResponse.json(await itemGroupStats(group));
}
