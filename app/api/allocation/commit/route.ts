import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { commitAllocation } from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    const result = await commitAllocation(session?.name);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
