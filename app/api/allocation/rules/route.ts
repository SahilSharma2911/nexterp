import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { allocationRuleFormSchema } from "@/modules/dms/allocation/schema";
import {
  getAllocationRule,
  updateAllocationRule,
} from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAllocationRule());
}

export async function PATCH(req: NextRequest) {
  try {
    const values = allocationRuleFormSchema.parse(await req.json());
    const row = await updateAllocationRule(values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}
