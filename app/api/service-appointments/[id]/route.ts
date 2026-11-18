import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { appointmentFormSchema } from "@/modules/dms/service-appointments/schema";
import {
  deleteServiceAppointment,
  getServiceAppointment,
  updateServiceAppointment,
} from "@/lib/services/service-appointments";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getServiceAppointment(id);
  if (!row)
    return NextResponse.json(
      { message: "Appointment not found" },
      { status: 404 },
    );
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = appointmentFormSchema.parse(await req.json());
    const row = await updateServiceAppointment(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteServiceAppointment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
