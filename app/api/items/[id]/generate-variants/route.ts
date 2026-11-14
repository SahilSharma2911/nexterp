import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { generateVariants } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await generateVariants(id);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
