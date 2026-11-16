import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-server";
import { getSession } from "@/lib/auth";
import { userUpdateSchema } from "@/features/users/schema";
import { deleteUser, getUserById, updateUser } from "@/lib/services/users";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const row = await getUserById(id);
  if (!row)
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const values = userUpdateSchema.parse(await req.json());
    const me = await getSession();

    // Guard: an admin can't lock themselves out.
    if (me && me.id === id && (values.role !== "ADMIN" || values.disabled)) {
      throw new Error("You can't remove your own admin access.");
    }

    const row = await updateUser(id, values);
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const me = await getSession();
    if (me && me.id === id) {
      throw new Error("You can't delete your own account.");
    }
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
