import { NextResponse } from "next/server";
import { allocationActivity } from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await allocationActivity());
}
