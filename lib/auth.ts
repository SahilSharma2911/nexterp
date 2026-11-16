import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
} from "@/lib/session";
import { canWrite, type Area } from "@/lib/permissions";

// Server-only auth helpers (bcrypt + reading the session cookie).

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

// Server-side write check for gating controls in server components.
export async function canWriteServer(area: Area): Promise<boolean> {
  const s = await getSession();
  return s ? canWrite(s.role, area) : false;
}
