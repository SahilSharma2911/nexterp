import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { startServiceAppointment } from "@/lib/services/service-appointments";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await startServiceAppointment(id);
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
