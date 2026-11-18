import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { appointmentFormSchema } from "@/modules/dms/service-appointments/schema";
import {
  createServiceAppointment,
  listServiceAppointments,
} from "@/lib/services/service-appointments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listServiceAppointments(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    vehicleId: sp.get("vehicleId") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = appointmentFormSchema.parse(await req.json());
    const row = await createServiceAppointment(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
