import { NextResponse } from "next/server";
import { customerOptions } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await customerOptions());
}
