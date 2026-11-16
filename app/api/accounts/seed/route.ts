import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { seedStandardChart } from "@/lib/services/chart-of-accounts";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await seedStandardChart();
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
